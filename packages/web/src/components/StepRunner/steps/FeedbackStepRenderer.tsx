import { useRef } from "react";
import type { BaseEntity, Bound, SpreadsheetRow, ScreenCompletionData } from "@/@types/screen.model";
// import { resolveBound } from "@/components/ScreenEntityRenderer/resolveBound";
import FeedbackSurveyTrial from "@/components/trials/FeedbackSurveyTrial";
import { buildStepResult } from "../buildStepResult";
type FeedbackStepEntity = BaseEntity<
	"FeedbackStep",
	{ questionSetId?: Bound<string> }
>;

interface FeedbackStepRendererProps {
	step: FeedbackStepEntity;
	row: SpreadsheetRow;
	onComplete: (data: ScreenCompletionData) => void;
}

const FeedbackStepRenderer: React.FC<FeedbackStepRendererProps> = ({
	step,
	row,
	onComplete,
}) => {
	// const _questionSetId = step.props.questionSetId
	// 	? resolveBound(step.props.questionSetId, row)
	// 	: undefined;
	const startedAtRef = useRef(Date.now());

	// TODO: resolve questionSetId to actual questions
	const questions: { prompt: string; name: string; labels: string[] }[] = [];

	return (
		<FeedbackSurveyTrial
			questions={questions}
			onComplete={(result) => {
				onComplete(buildStepResult({
					stepUid: step.uid,
					row: row,
					advanceReason: "continue-click",
					startedAt: startedAtRef.current,
					responses: { feedback: result },
				}));
			}}
		/>
	);
};

export default FeedbackStepRenderer;
