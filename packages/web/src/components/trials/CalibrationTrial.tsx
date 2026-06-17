import { useCallback, useEffect, useRef } from "react";

interface CalibrationTracker {
	clearData: () => void;
	recordScreenPosition: (x: number, y: number) => void;
	resume: () => void;
	pause: () => void;
	hidePreview: () => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CalibrationTrialProps {
	calibrationPoints: [number, number][];
	predictionsPerPoint?: number;
	predictionInterval?: number;
	timeToSaccade?: number;
	randomizeOrder?: boolean;
	repetitionsPerPoint?: number;
	pointSize?: number;
	webgazer: CalibrationTracker;
	onComplete: (response: { points_calibrated: number; predictions_collected: number }) => void;
}

const CalibrationTrial: React.FC<CalibrationTrialProps> = ({
	calibrationPoints,
	predictionsPerPoint = 10,
	predictionInterval = 200,
	timeToSaccade = 1000,
	randomizeOrder = true,
	repetitionsPerPoint = 1,
	pointSize = 40,
	webgazer,
	onComplete,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const isRunningRef = useRef(false);

	const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}, []);

	useEffect(() => {
		if (isRunningRef.current) return;
		isRunningRef.current = true;

		const container = containerRef.current;
		if (!container) return;

		// Clear existing calibration data
		webgazer.clearData();

		// Prepare points
		let points = [...calibrationPoints];
		if (randomizeOrder) {
			points = shuffleArray(points);
		}

		const allPoints: [number, number][] = [];
		for (let r = 0; r < repetitionsPerPoint; r++) {
			allPoints.push(...points);
		}

		let totalPredictions = 0;

		const runCalibration = async () => {
			webgazer.hidePreview();
			webgazer.resume();

			for (let i = 0; i < allPoints.length; i++) {
				const [xPercent, yPercent] = allPoints[i];
				let remaining = predictionsPerPoint;

				// Render point (pre-collection state)
				const renderPoint = (collecting: boolean) => {
					const bgColor = collecting ? "#5D69D9" : "#8CA9D5";
					const textColor = collecting ? "#fff" : "rgba(255, 255, 255, 0.5)";
					container.innerHTML = `
						<div style="position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; z-index: 9999;">
							<div id="calibration-point" style="position: absolute; left: ${xPercent}%; top: ${yPercent}%;
								width: ${pointSize}px; height: ${pointSize}px;
								border-radius: 50%; background: ${bgColor}; border: 1px solid #000;
								transform: translate(-50%, -50%);
								display: flex; align-items: center; justify-content: center;
								color: ${textColor}; font-size: ${Math.max(12, pointSize * 0.4)}px; font-weight: bold;
								transition: background 0.2s, color 0.2s;">
								${remaining}
							</div>
						</div>
					`;
				};

				renderPoint(false);

				// Get the actual screen coordinates of the calibration point
				const ptDom = container.querySelector<HTMLElement>("#calibration-point");
				if (!ptDom) continue;

				const br = ptDom.getBoundingClientRect();
				const calibX = br.left + br.width / 2;
				const calibY = br.top + br.height / 2;

				// Wait for saccade
				await sleep(timeToSaccade);

				// Start collecting
				renderPoint(true);

				// Re-acquire coordinates after re-render
				const ptDomUpdated = container.querySelector<HTMLElement>("#calibration-point");
				let finalX = calibX;
				let finalY = calibY;
				if (ptDomUpdated) {
					const brUpdated = ptDomUpdated.getBoundingClientRect();
					finalX = brUpdated.left + brUpdated.width / 2;
					finalY = brUpdated.top + brUpdated.height / 2;
				}

				for (let s = 0; s < predictionsPerPoint; s++) {
					webgazer.recordScreenPosition(finalX, finalY);
					totalPredictions++;
					remaining--;

					// Update countdown
					const el = container.querySelector<HTMLElement>("#calibration-point");
					if (el) el.textContent = String(remaining);

					if (s < predictionsPerPoint - 1) {
						await sleep(predictionInterval);
					}
				}
			}

			webgazer.pause();

			container.innerHTML = "";
			onComplete({
				points_calibrated: allPoints.length,
				predictions_collected: totalPredictions,
			});
		};

		runCalibration();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return <div ref={containerRef} style={{ width: "100%", height: "100%", cursor: "none" }} />;
};

export default CalibrationTrial;
