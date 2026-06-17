import { useEffect, useRef } from "react";
import { Spinner, Typography } from "@leux/ui";
import type { BaseEntity, Bound, SpreadsheetRow, ScreenCompletionData } from "@/@types/screen.model";
import { defaultCalibrationConfig } from "@/@types/screen.model";
// import { resolveBound } from "@/components/ScreenEntityRenderer/resolveBound";
import ValidationTrial from "@/components/trials/ValidationTrial";
import { useEyeTrackingSession } from "../EyeTrackingSessionContext";
import { buildStepResult } from "../buildStepResult";

type ValidationStepEntity = BaseEntity<
	"ValidationStep",
	{ preset?: Bound<string> }
>;

interface ValidationStepRendererProps {
	step: ValidationStepEntity;
	row: SpreadsheetRow;
	onComplete: (data: ScreenCompletionData) => void;
}

const ValidationStepRenderer: React.FC<ValidationStepRendererProps> = ({
	step,
	row,
	onComplete,
}) => {
	// const _preset = step.props.preset ? resolveBound(step.props.preset, row) : undefined;
	const config = defaultCalibrationConfig; // TODO: resolve preset to config
	const eyeTracking = useEyeTrackingSession();
	const startedAtRef = useRef(Date.now());

	useEffect(() => {
		if (!eyeTracking.isReady) {
			void eyeTracking.ensureReady().catch(() => undefined);
		}
	}, [eyeTracking.ensureReady, eyeTracking.isReady]);

	if (eyeTracking.error) {
		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					width: "100%",
					height: "100%",
					padding: 24,
					textAlign: "center",
					gap: 12,
				}}
			>
				<Typography variant="h3" textColor="danger">Eye Tracking Error</Typography>
				<Typography>{eyeTracking.error}</Typography>
			</div>
		);
	}

	if (!eyeTracking.isReady) {
		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					width: "100%",
					height: "100%",
					gap: 16,
				}}
			>
				<Spinner size="large" />
				<Typography>Preparing eye tracking...</Typography>
			</div>
		);
	}

	return (
		<ValidationTrial
			validationPoints={config.validationPoints}
			timeToSaccade={config.timeToSaccade}
			roiRadius={config.roiRadius}
			webgazer={eyeTracking}
			onComplete={(result) => {
				eyeTracking.completeValidation(result);
				onComplete(
					buildStepResult({
						stepUid: step.uid,
						row,
						advanceReason: "continue-click",
						startedAt: startedAtRef.current,
						responses: { validation: result },
					})
				);
			}}
		/>
	);
};

export default ValidationStepRenderer;
