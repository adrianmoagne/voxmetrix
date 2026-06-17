interface WebGazer {
	begin: () => Promise<WebGazer>;
	end: () => void;
	pause: () => WebGazer;
	resume: () => WebGazer;
	setRegression: (type: string) => WebGazer;
	applyKalmanFilter: (apply: boolean) => WebGazer;
	setGazeListener: (listener: (data: { x: number; y: number } | null, timestamp: number) => void) => WebGazer;
	clearData?: () => void;
	recordScreenPosition: (x: number, y: number, eventType?: string) => void;
	getCurrentPrediction: () => Promise<{ x: number; y: number; t?: number } | null>;
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
