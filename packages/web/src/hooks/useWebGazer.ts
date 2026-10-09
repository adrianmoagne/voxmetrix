import { useCallback, useRef, useState } from "react";
import {
	FrameDrivenGazeCapture,
	emptyCaptureResult,
	patchTrackerToReadCanvas,
	type ActiveAudio,
	type GazeCaptureResult,
} from "@/utils/gazeCapture";

export type { ActiveAudio, GazeCaptureResult, GazeSample } from "@/utils/gazeCapture";

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
/** `performance.now()` origin of the elapsed time WebGazer passes to gaze listeners. */
let webgazerBeginTime: number | null = null;

export interface GazePoint {
	x: number;
	y: number;
	t: number;
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
	stopTracking: () => GazeCaptureResult;
	finishTracking: () => Promise<GazeCaptureResult>;
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

/**
 * Predictions are never smoothed, so validation accuracy is measured on the same
 * raw output the trials record (`GazeCaptureMeta.gazeFilter`).
 */
export const PREDICTION_FILTER = "none" as const;

const configureWebGazer = (webgazer: WebGazer): void => {
	clearWebGazerData(webgazer);
	webgazer.setRegression("ridge");
	webgazer.applyKalmanFilter(false);
};

export const useWebGazer = (options?: UseWebGazerOptions): UseWebGazerReturn => {
	const [isLoaded, setIsLoaded] = useState(scriptLoaded || !!getWebGazer());
	const [isTracking, setIsTracking] = useState(false);
	const captureRef = useRef<FrameDrivenGazeCapture | null>(null);
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
				.setInitFinishListener((_stream, beginTime) => {
					webgazerBeginTime = typeof beginTime === "number" ? beginTime : null;
				})
				.setGazeListener(() => {
					// Gaze collection is set when tracking starts.
				})
				.begin();

			patchTrackerToReadCanvas(existingWebGazer);
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

		if (captureRef.current?.isRunning) {
			captureRef.current.stop();
		}

		const video = document.getElementById(
			webgazer.params.videoElementId
		) as HTMLVideoElement | null;
		const capture = new FrameDrivenGazeCapture({
			webgazer,
			video,
			getActiveAudio: () => getActiveAudioRef.current?.() ?? null,
			beginTime: webgazerBeginTime,
		});
		captureRef.current = capture;
		capture.start();
		setIsTracking(true);
	}, []);

	const stopTracking = useCallback((): GazeCaptureResult => {
		setIsTracking(false);

		const capture = captureRef.current;
		captureRef.current = null;
		if (capture) {
			return capture.stop();
		}

		const webgazer = getWebGazer();
		if (webgazer) {
			webgazer.pause();
		}
		return emptyCaptureResult();
	}, []);

	const finishTracking = useCallback(async (): Promise<GazeCaptureResult> => {
		const capture = captureRef.current;
		if (!capture) return stopTracking();

		const result = await capture.finish();
		if (captureRef.current === capture) {
			captureRef.current = null;
			setIsTracking(false);
		}
		return result;
	}, [stopTracking]);

	const clearData = useCallback(() => {
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
		if (captureRef.current?.isRunning) {
			try {
				captureRef.current.stop();
			} catch {
				// The library may already be torn down.
			}
		}
		captureRef.current = null;
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
		finishTracking,
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
