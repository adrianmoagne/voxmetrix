import type { ScreenCompletionData } from "@/@types/screen.model";
import type { ExecutionStep } from "@/hooks/useExperimentEngine";
import type { AudioProgressState } from "@/utils/audioProgressUtils";
import { ScreenEntityRenderer } from "@/components/ScreenEntityRenderer";
import FixationStepRenderer from "./steps/FixationStepRenderer";
import CalibrationStepRenderer from "./steps/CalibrationStepRenderer";
import ValidationStepRenderer from "./steps/ValidationStepRenderer";
import FeedbackStepRenderer from "./steps/FeedbackStepRenderer";

interface StepRunnerProps {
	executionStep: ExecutionStep;
	onComplete: (data: ScreenCompletionData) => void;
	audioProgress?: AudioProgressState | null;
}

const StepRunner: React.FC<StepRunnerProps> = ({ executionStep, onComplete, audioProgress }) => {
	const { step, row, index, presentation } = executionStep;

	const handleComplete = (data: ScreenCompletionData) => {
		onComplete({
			...data,
			presentation: data.presentation ?? presentation,
		});
	};

	switch (step.kind) {
		case "Screen":
			return (
				<ScreenEntityRenderer
					key={`${index}-${step.uid}-${row.uid}`}
					screen={step}
					row={row}
					onComplete={handleComplete}
					audioProgress={audioProgress}
				/>
			);

		case "FixationStep":
			return <FixationStepRenderer step={step} row={row} onComplete={handleComplete} />;

		case "CalibrationStep":
			return <CalibrationStepRenderer step={step} row={row} onComplete={handleComplete} />;

		case "ValidationStep":
			return <ValidationStepRenderer step={step} row={row} onComplete={handleComplete} />;

		case "FeedbackStep":
			return <FeedbackStepRenderer step={step} row={row} onComplete={handleComplete} />;

		default:
			return null;
	}
};

export default StepRunner;
