import { useCallback, useRef, useState } from "react";
import type { WebAudioTrack } from "@/utils/webAudioPlayback";

const WEBGAZER_SCRIPT_SRC = `${import.meta.env.BASE_URL}webgazer.js`;
const WEBGAZER_SCRIPT_SELECTOR = 'script[data-webgazer-script="true"]';

const rejectScriptLoad = (reject: (reason?: unknown) => void, script?: HTMLScriptElement | null) => {
	loadPromise = null;
	if (script) script.remove();
	reject(new Error("Failed to load WebGazer script"));
};

let loadPromise: Promise<void> | null = null;
let initPromise: Promise<void> | null = null;
let scriptLoaded = false;
let cameraInitialized = false;

export interface GazePoint {
	x: number;
	y: number;
	t: number;
	audioUid?: string;
	audioTime?: number;
}

export interface ActiveAudio {
	uid: string;
	track: WebAudioTrack;
}

export interface UseWebGazerOptions {
	getActiveAudio?: () => ActiveAudio | null;
}

export interface UseWebGazerReturn {
	isLoaded: boolean;
	isTracking: boolean;
	loadWebGazer: () => Promise<void>;
	initCamera: () => Promise<void>;
	startTracking: () => void;
	stopTracking: () => GazePoint[];
	clearData: () => void;
	recordScreenPosition: (x: number, y: number) => void;
	getCurrentPrediction: () => Promise<GazePoint | null>;
	resetCalibration: () => void;
	resume: () => void;
	pause: () => void;
	hidePreview: () => void;
	showPositioningPreview: (size?: { width: number; height: number }) => void;
	cleanup: () => void;
}

const getWebGazer = (): WebGazer | null => {
	if (typeof window === "undefined") return null;
	return window.webgazer ?? null;
};

const clearWebGazerData = (webgazer: WebGazer): void => {
	if (typeof webgazer.clearData === "function") {
		webgazer.clearData();
	}
};

const configureWebGazer = (webgazer: WebGazer): void => {
	clearWebGazerData(webgazer);
	webgazer.setRegression("ridge");
	webgazer.applyKalmanFilter(true);
};

export const useWebGazer = (options?: UseWebGazerOptions): UseWebGazerReturn => {
	const [isLoaded, setIsLoaded] = useState(scriptLoaded || !!getWebGazer());
	const [isTracking, setIsTracking] = useState(false);
	const gazeDataRef = useRef<GazePoint[]>([]);
	const trackingRef = useRef(false);
	const getActiveAudioRef = useRef(options?.getActiveAudio);
	getActiveAudioRef.current = options?.getActiveAudio;

	const loadWebGazer = useCallback(async () => {
		const existingWebGazer = getWebGazer();
		if (existingWebGazer) {
			configureWebGazer(existingWebGazer);
			scriptLoaded = true;
			setIsLoaded(true);
			return;
		}

		if (loadPromise) {
			await loadPromise;
			setIsLoaded(true);
			return;
		}

		loadPromise = new Promise<void>((resolve, reject) => {
			const handleLoaded = () => {
				const loadedWebGazer = getWebGazer();
				if (!loadedWebGazer) {
					loadPromise = null;
					reject(new Error("WebGazer script loaded but window.webgazer is unavailable"));
					return;
				}

				configureWebGazer(loadedWebGazer);
				scriptLoaded = true;
				setIsLoaded(true);
				resolve();
			};

			const existingScript = document.querySelector<HTMLScriptElement>(WEBGAZER_SCRIPT_SELECTOR);
			if (existingScript) {
				if (existingScript.dataset.webgazerLoaded === "true") {
					handleLoaded();
					return;
				}

				existingScript.addEventListener("load", handleLoaded, { once: true });
				existingScript.addEventListener(
					"error",
					() => rejectScriptLoad(reject, existingScript),
					{ once: true }
				);
				return;
			}

			const script = document.createElement("script");
			script.src = WEBGAZER_SCRIPT_SRC;
			script.async = true;
			script.dataset.webgazerScript = "true";
			script.onload = () => {
				script.dataset.webgazerLoaded = "true";
				handleLoaded();
			};
			script.onerror = () => rejectScriptLoad(reject, script);
			document.head.appendChild(script);
		});

		await loadPromise;
	}, []);

	const initCamera = useCallback(async () => {
		await loadWebGazer();

		const existingWebGazer = getWebGazer();
		if (!existingWebGazer) {
			throw new Error("WebGazer not loaded");
		}

		if (cameraInitialized) {
			return;
		}

		if (initPromise) {
			await initPromise;
			return;
		}

		initPromise = (async () => {
			existingWebGazer.showVideoPreview(false);
			existingWebGazer.showPredictionPoints(false);
			existingWebGazer.showFaceOverlay(false);
			existingWebGazer.showFaceFeedbackBox(false);

			await existingWebGazer
				.setGazeListener(() => {
					// Gaze collection is set when tracking starts.
				})
				.begin();

		
			cameraInitialized = true;
		})();

		try {
			await initPromise;
		} finally {
			initPromise = null;
		}
	}, [loadWebGazer]);

	const startTracking = useCallback(() => {
		const webgazer = getWebGazer();
		if (!webgazer || !cameraInitialized) {
			throw new Error("WebGazer camera is not initialized");
		}

		webgazer.showVideoPreview(false);
		webgazer.showFaceOverlay(false);
		webgazer.showFaceFeedbackBox(false);

		gazeDataRef.current = [];
		trackingRef.current = true;
		setIsTracking(true);

		webgazer.resume();
		webgazer.setGazeListener((data: { x: number; y: number } | null) => {
			if (!data || !trackingRef.current) return;

			const point: GazePoint = {
				x: data.x,
				y: data.y,
				t: performance.now(),
			};

			const activeAudio = getActiveAudioRef.current?.();
			if (activeAudio) {
				const audioTime = activeAudio.track.getPlaybackTime();
				if (audioTime !== null) {
					point.audioUid = activeAudio.uid;
					point.audioTime = audioTime;
				}
			}

			gazeDataRef.current.push(point);
		});
	}, []);

	const stopTracking = useCallback((): GazePoint[] => {
		trackingRef.current = false;
		setIsTracking(false);

		const webgazer = getWebGazer();
		if (webgazer) {
			webgazer.pause();
		}

		const data = [...gazeDataRef.current];
		gazeDataRef.current = [];
		return data;
	}, []);

	const clearData = useCallback(() => {
		gazeDataRef.current = [];

		const webgazer = getWebGazer();
		if (webgazer) {
			clearWebGazerData(webgazer);
		}
	}, []);

	const recordScreenPosition = useCallback((x: number, y: number) => {
		const webgazer = getWebGazer();
		if (webgazer) {
			webgazer.recordScreenPosition(x, y, "click");
		}
	}, []);

	const getCurrentPrediction = useCallback(async (): Promise<GazePoint | null> => {
		const webgazer = getWebGazer();
		if (!webgazer) return null;

		try {
			const prediction = await webgazer.getCurrentPrediction();
			if (prediction) {
				return {
					x: prediction.x,
					y: prediction.y,
					t: typeof prediction.t === "number" ? prediction.t : performance.now(),
				};
			}
		} catch {
			// Ignore prediction errors from the underlying library.
		}

		return null;
	}, []);

	const resetCalibration = useCallback(() => {
		const webgazer = getWebGazer();
		if (webgazer) {
			clearWebGazerData(webgazer);
		}
	}, []);

	const resume = useCallback(() => {
		const webgazer = getWebGazer();
		if (webgazer) webgazer.resume();
	}, []);

	const pause = useCallback(() => {
		const webgazer = getWebGazer();
		if (webgazer) webgazer.pause();
	}, []);

	const hidePreview = useCallback(() => {
		const webgazer = getWebGazer();
		if (webgazer) {
			webgazer.showVideoPreview(false);
			webgazer.showFaceOverlay(false);
			webgazer.showFaceFeedbackBox(false);
		}
	}, []);

	const showPositioningPreview = useCallback((size?: { width: number; height: number }) => {
		const webgazer = getWebGazer();
		if (!webgazer || !cameraInitialized) return;

		if (size?.width && size?.height && webgazer.setVideoViewerSize) {
			webgazer.setVideoViewerSize(size.width, size.height);
		}

		webgazer.showVideoPreview(false);
		webgazer.showPredictionPoints(false);
		webgazer.showFaceOverlay(true);
		webgazer.showFaceFeedbackBox(true);
		webgazer.resume();

		const videoContainer = document.getElementById("webgazerVideoContainer");
		const video = document.getElementById("webgazerVideoFeed") as HTMLVideoElement | null;
		const isMountedInCustomPreview = videoContainer?.parentElement?.closest("[data-webgazer-preview-root]");
		if (videoContainer && isMountedInCustomPreview)  {
			videoContainer.style.display = "block";
			videoContainer.style.opacity = "1";
		}
		if (video && isMountedInCustomPreview) {
			video.style.display = "block";
			video.style.opacity = "1";
		}
	}, []);

	const cleanup = useCallback(() => {
		trackingRef.current = false;
		gazeDataRef.current = [];
		setIsTracking(false);
		setIsLoaded(scriptLoaded);

		try {
			const videoElement = document.getElementById("webgazerVideoFeed") as HTMLVideoElement | null;
			if (videoElement?.srcObject) {
				const stream = videoElement.srcObject as MediaStream;
				stream.getTracks().forEach((track) => track.stop());
				videoElement.srcObject = null;
			}

			const webgazer = getWebGazer();
			if (webgazer) {
				try {
					webgazer.end();
				} catch {
					// Ignore cleanup errors from the underlying library.
				}

				const videoContainer = document.getElementById("webgazerVideoContainer");
				if (videoContainer) {
					videoContainer.remove();
				}
			}

			const gazeDot = document.getElementById("custom-gaze-dot");
			if (gazeDot) gazeDot.remove();
		} catch {
			// Ignore cleanup errors from partially initialized sessions.
		} finally {
			cameraInitialized = false;
			initPromise = null;
		}
	}, []);

	return {
		isLoaded,
		isTracking,
		loadWebGazer,
		initCamera,
		startTracking,
		stopTracking,
		clearData,
		recordScreenPosition,
		getCurrentPrediction,
		resetCalibration,
		resume,
		pause,
		hidePreview,
		showPositioningPreview,
		cleanup,
	};
};

export default useWebGazer;
