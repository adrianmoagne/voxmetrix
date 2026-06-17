import { useEffect, useRef } from "react";

interface ValidationTracker {
	getCurrentPrediction: () => Promise<{ x: number; y: number; t: number } | null>;
	resume: () => void;
	pause: () => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ValidationTrialProps {
	validationPoints: [number, number][];
	predictionsPerPoint?: number;
	predictionInterval?: number;
	timeToSaccade?: number;
	roiRadius?: number;
	pointSize?: number;
	randomizeOrder?: boolean;
	webgazer: ValidationTracker;
	onComplete: (response: {
		raw_gaze: { x: number; y: number }[][];
		percent_in_roi: number[];
		average_offset: { x: number; y: number }[];
	}) => void;
}

const ValidationTrial: React.FC<ValidationTrialProps> = ({
	validationPoints,
	predictionsPerPoint = 10,
	predictionInterval = 200,
	timeToSaccade = 1000,
	roiRadius = 200,
	pointSize = 40,
	randomizeOrder = false,
	webgazer,
	onComplete,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const isRunningRef = useRef(false);

	useEffect(() => {
		if (isRunningRef.current) return;
		isRunningRef.current = true;

		const container = containerRef.current;
		if (!container) return;

		let points = [...validationPoints];
		if (randomizeOrder) {
			const shuffled = [...points];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			points = shuffled;
		}

		const rawGaze: { x: number; y: number }[][] = [];
		const percentInRoi: number[] = [];
		const averageOffset: { x: number; y: number }[] = [];

		const runValidation = async () => {
			webgazer.resume();

			for (let i = 0; i < points.length; i++) {
				const [xPercent, yPercent] = points[i];
				let remaining = predictionsPerPoint;
				const pointGaze: { x: number; y: number }[] = [];

				const renderPoint = (collecting: boolean) => {
					const bgColor = collecting ? "#70c1b4d2" : "#70C1B3";
					const textColor = collecting ? "#fff" : "rgba(255, 255, 255, 0.5)";
					container.innerHTML = `
						<div style="position: relative; width: 100vw; height: 100vh;">
							<div id="validation-point" style="position: absolute; left: ${xPercent}%; top: ${yPercent}%;
								width: ${pointSize}px; height: ${pointSize}px;
								border-radius: 50%; background: ${bgColor}; border: 1px solid #000;
								transform: translate(-50%, -50%); z-index: 9999;
								display: flex; align-items: center; justify-content: center;
								color: ${textColor}; font-size: ${Math.max(12, pointSize * 0.4)}px; font-weight: bold;
								transition: background 0.2s, color 0.2s;">
								${remaining}
							</div>
						</div>
					`;
				};

				renderPoint(false);

				// Get target coordinates
				const ptDom = container.querySelector<HTMLElement>("#validation-point");
				if (!ptDom) continue;

				const br = ptDom.getBoundingClientRect();
				const targetX = br.left + br.width / 2;
				const targetY = br.top + br.height / 2;

				// Wait for saccade
				await sleep(timeToSaccade);

				// Start collecting predictions
				renderPoint(true);

				let lastT: number | null = null;
				let predictions = 0;

				while (predictions < predictionsPerPoint) {
					const prediction = await webgazer.getCurrentPrediction();

					if (prediction && prediction.t !== lastT) {
						lastT = prediction.t;
						pointGaze.push({ x: prediction.x, y: prediction.y });
						predictions++;
						remaining--;

						const el = container.querySelector<HTMLElement>("#validation-point");
						if (el) el.textContent = String(remaining);
					}

					await sleep(predictionInterval);
				}

				// Calculate metrics for this point
				rawGaze.push(pointGaze);

				const inRoi = pointGaze.filter((g) => {
					const dist = Math.sqrt(
						Math.pow(g.x - targetX, 2) + Math.pow(g.y - targetY, 2)
					);
					return dist <= roiRadius;
				}).length;
				percentInRoi.push(pointGaze.length > 0 ? (inRoi / pointGaze.length) * 100 : 0);

				const avgX =
					pointGaze.length > 0
						? pointGaze.reduce((sum, g) => sum + g.x, 0) / pointGaze.length
						: 0;
				const avgY =
					pointGaze.length > 0
						? pointGaze.reduce((sum, g) => sum + g.y, 0) / pointGaze.length
						: 0;
				averageOffset.push({ x: avgX - targetX, y: avgY - targetY });
			}

			webgazer.pause();

			container.innerHTML = "";
			onComplete({
				raw_gaze: rawGaze,
				percent_in_roi: percentInRoi,
				average_offset: averageOffset,
			});
		};

		runValidation();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return <div ref={containerRef} style={{ width: "100%", height: "100%", cursor: "none" }} />;
};

export default ValidationTrial;
