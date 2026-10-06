interface WebGazerPrediction {
	x: number;
	y: number;
	t?: number;
	eyeFeatures?: unknown;
}

interface WebGazerTracker {
	/**
	 * Runs the face model on `input` and crops eye patches from `imageCanvas`. The library
	 * passes its own video element as `input`; we override this to read from the canvas.
	 */
	getEyePatches: (
		input: HTMLVideoElement | HTMLCanvasElement,
		imageCanvas: HTMLCanvasElement,
		width: number,
		height: number
	) => Promise<unknown>;
}

interface WebGazerParams {
	applyKalmanFilter: boolean;
	videoElementId: string;
	videoElementCanvasId: string;
	[key: string]: unknown;
}

interface WebGazer {
	params: WebGazerParams;
	begin: () => Promise<WebGazer>;
	end: () => void;
	pause: () => WebGazer;
	resume: () => Promise<WebGazer>;
	setRegression: (type: string) => WebGazer;
	applyKalmanFilter: (apply: boolean) => WebGazer;
	/** `elapsedMs` is measured right after the frame grab, before inference (relative to `begin`). */
	setGazeListener: (
		listener: (data: { x: number; y: number } | null, elapsedMs: number) => void
	) => WebGazer;
	clearGazeListener: () => WebGazer;
	/** Called once `begin()` has the camera running; `beginTime` is the `performance.now()` origin of `elapsedMs`. */
	setInitFinishListener: (listener: (stream: unknown, beginTime: number) => void) => WebGazer;
	clearData?: () => void;
	recordScreenPosition: (x: number, y: number, eventType?: string) => void;
	/** Runs the tracker on the current frame and returns the regression output (no listener side effects). */
	getCurrentPrediction: (regressionIndex?: number) => Promise<WebGazerPrediction | null>;
	getTracker: () => WebGazerTracker;
	getVideoElementCanvas: () => HTMLCanvasElement | null;
	showVideoPreview: (show: boolean) => WebGazer;
	showPredictionPoints: (show: boolean) => WebGazer;
	showFaceOverlay: (show: boolean) => WebGazer;
	showFaceFeedbackBox: (show: boolean) => WebGazer;
	setVideoViewerSize: (width: number, height: number) => WebGazer;
	hidePredictions: () => void;
}

interface Window {
	webgazer: WebGazer;
}
