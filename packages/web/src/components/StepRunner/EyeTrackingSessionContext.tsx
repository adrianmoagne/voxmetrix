import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import useWebGazer, { type ActiveAudio, type GazePoint } from "@/hooks/useWebGazer";
import type { WebAudioTrack } from "@/utils/webAudioPlayback";

export interface CalibrationResult {
	points_calibrated: number;
	predictions_collected: number;
}

export interface ValidationResult {
	raw_gaze: { x: number; y: number }[][];
	percent_in_roi: number[];
	average_offset: { x: number; y: number }[];
}

export type EyeTrackingStatus = "idle" | "loading" | "ready" | "tracking" | "error";

export interface EyeTrackingSession {
	status: EyeTrackingStatus;
	isReady: boolean;
	isTracking: boolean;
	hasCalibration: boolean;
	lastCalibration: CalibrationResult | null;
	lastValidation: ValidationResult | null;
	error: string | null;

	ensureReady: () => Promise<void>;
	startCapture: () => Promise<void>;
	stopCapture: () => GazePoint[];
	clearCapture: () => void;

	registerActiveAudio: (uid: string, track: WebAudioTrack) => void;
	unregisterActiveAudio: (uid: string) => void;

	clearData: () => void;
	recordScreenPosition: (x: number, y: number) => void;
	getCurrentPrediction: () => Promise<GazePoint | null>;
	resume: () => void;
	pause: () => void;
	hidePreview: () => void;
	showPositioningPreview: (size?: { width: number; height: number }) => void;

	completeCalibration: (result: CalibrationResult) => void;
	completeValidation: (result: ValidationResult) => void;
	invalidateCalibration: () => void;
	cleanup: () => void;
}

const EyeTrackingSessionContext = createContext<EyeTrackingSession | null>(null);

export const useEyeTrackingSession = (): EyeTrackingSession => {
	const ctx = useContext(EyeTrackingSessionContext);
	if (!ctx) {
		throw new Error("useEyeTrackingSession must be used within EyeTrackingSessionProvider");
	}
	return ctx;
};

export const useOptionalEyeTrackingSession = (): EyeTrackingSession | null =>
	useContext(EyeTrackingSessionContext);

interface EyeTrackingSessionProviderProps {
	children: React.ReactNode;
}

export const EyeTrackingSessionProvider: React.FC<EyeTrackingSessionProviderProps> = ({
	children,
}) => {
	const activeAudioRef = useRef<ActiveAudio | null>(null);

	const registerActiveAudio = useCallback((uid: string, track: WebAudioTrack) => {
		activeAudioRef.current = { uid, track };
	}, []);

	const unregisterActiveAudio = useCallback((uid: string) => {
		if (activeAudioRef.current?.uid === uid) {
			activeAudioRef.current = null;
		}
	}, []);

	const {
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
		cleanup: cleanupWebGazer,
	} = useWebGazer({ getActiveAudio: () => activeAudioRef.current });

	const [status, setStatus] = useState<EyeTrackingStatus>("idle");
	const [isReady, setIsReady] = useState(false);
	const [hasCalibration, setHasCalibration] = useState(false);
	const [lastCalibration, setLastCalibration] = useState<CalibrationResult | null>(null);
	const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const readyPromiseRef = useRef<Promise<void> | null>(null);

	const ensureReady = useCallback(async () => {
		if (isReady) return;
		if (readyPromiseRef.current) return readyPromiseRef.current;
		setStatus("loading");
		setError(null);

		readyPromiseRef.current = (async () => {
			try {
				await loadWebGazer();
				await initCamera();
				setIsReady(true);
				setStatus("ready");
			} catch (error) {
				setError(error instanceof Error ? error.message : "Failed to initialize eye tracking");
				setStatus("error");
				throw error;
			} finally {
				readyPromiseRef.current = null;
				}
			})();
		return readyPromiseRef.current;
	}, [initCamera, isReady, loadWebGazer]);

	const startCapture = useCallback(async () => {
		await ensureReady();
		startTracking();
		setStatus("tracking");
	}, [ensureReady, startTracking]);

	const stopCapture = useCallback(() => {
		const gazeData = stopTracking();
		setStatus("ready");
		return gazeData;
	}, [stopTracking]);

	const clearCapture = useCallback(() => {
		clearData();
	}, [clearData]);

	const completeCalibration = useCallback((result: CalibrationResult) => {
		setHasCalibration(true);
		setLastCalibration(result);
	}, []);

	const completeValidation = useCallback((result: ValidationResult) => {
		setLastValidation(result);
	}, []);

	const invalidateCalibration = useCallback(() => {
		setHasCalibration(false);
		setLastCalibration(null);
		setLastValidation(null);
		resetCalibration();
	}, [resetCalibration]);

	const cleanup = useCallback(() => {
		cleanupWebGazer();
		setStatus("idle");
		setIsReady(false);
		setHasCalibration(false);
		setLastCalibration(null);
		setLastValidation(null);
		setError(null);
	}, [cleanupWebGazer]);

	useEffect(() => {
		return () => cleanup();
	}, [cleanup]);

	const value = useMemo<EyeTrackingSession>(
		() => ({
			status,
			isReady,
			isTracking,
			hasCalibration,
			lastCalibration,
			lastValidation,
			error,
			ensureReady,
			startCapture,
			stopCapture,
			clearCapture,
			registerActiveAudio,
			unregisterActiveAudio,
			clearData: clearCapture,
			recordScreenPosition,
			getCurrentPrediction,
			resume,
			pause,
			hidePreview,
			showPositioningPreview,
			completeCalibration,
			completeValidation,
			invalidateCalibration,
			cleanup,
		}),
		[
			status,
			isReady,
			isTracking,
			hasCalibration,
			lastCalibration,
			lastValidation,
			error,
			ensureReady,
			startCapture,
			stopCapture,
			clearCapture,
			registerActiveAudio,
			unregisterActiveAudio,
			recordScreenPosition,
			getCurrentPrediction,
			resume,
			pause,
			hidePreview,
			showPositioningPreview,
			completeCalibration,
			completeValidation,
			invalidateCalibration,
			cleanup,
		]
	);
	return (
		<EyeTrackingSessionContext.Provider value={value}>
			{children}
		</EyeTrackingSessionContext.Provider>
	);
};
