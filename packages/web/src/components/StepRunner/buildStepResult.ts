import type { AdvanceReason, ScreenCompletionData, SpreadsheetRow } from "@/@types/screen.model";

interface BuildStepResultArgs {
	stepUid: string;
	row: SpreadsheetRow;
	startedAt: number;
	advanceReason: AdvanceReason;
	responses?: Record<string, unknown>;
}

export const buildStepResult = ({
	stepUid,
	row,
	startedAt,
	advanceReason,
	responses = {},
}: BuildStepResultArgs): ScreenCompletionData => {
	return {
		screenUid: stepUid,
		rowUid: row.uid,
		advanceReason,
		startedAt,
		completedAt: Date.now(),
		responses,
	};
};
