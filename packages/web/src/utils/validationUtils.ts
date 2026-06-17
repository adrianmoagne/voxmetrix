import type { CalibrationConfig } from "@/@types/screen.model";

export interface ValidationResponse {
	raw_gaze?: { x: number; y: number }[][];
	percent_in_roi?: number[];
	average_offset?: { x: number; y: number }[];
}


export function checkValidationFailed(
	validationResponse: ValidationResponse | null | undefined,
	calibrationConfig: CalibrationConfig
): boolean {
	if (!validationResponse?.raw_gaze || !Array.isArray(validationResponse.raw_gaze)) {
		return true;
	}

	const screenWidth = window.innerWidth;
	const screenHeight = window.innerHeight;
	const validationPointsPixels = calibrationConfig.validationPoints.map(
		([xPercent, yPercent]) => ({
			x: (xPercent / 100) * screenWidth,
			y: (yPercent / 100) * screenHeight,
		})
	);

	let failedPoints = 0;

	validationResponse.raw_gaze.forEach(
		(gazeDataForPoint: { x: number; y: number }[], targetIndex: number) => {
			if (!gazeDataForPoint || gazeDataForPoint.length === 0) {
				failedPoints++;
				return;
			}

			const avgX =
				gazeDataForPoint.reduce((sum: number, g: { x: number }) => sum + g.x, 0) /
				gazeDataForPoint.length;
			const avgY =
				gazeDataForPoint.reduce((sum: number, g: { y: number }) => sum + g.y, 0) /
				gazeDataForPoint.length;

			let closestPointIndex = 0;
			let closestDistance = Infinity;

			validationPointsPixels.forEach((point, index) => {
				const dist = Math.sqrt(
					Math.pow(point.x - avgX, 2) + Math.pow(point.y - avgY, 2)
				);
				if (dist < closestDistance) {
					closestDistance = dist;
					closestPointIndex = index;
				}
			});

			if (closestPointIndex !== targetIndex) {
				failedPoints++;
			}
		}
	);

	return failedPoints > calibrationConfig.failedPointsThreshold;
}
