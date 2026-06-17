import type {
	LateralCounterbalancePresentation,
	ScreenEntity,
	SpreadsheetRow,
} from "@/@types/screen.model";

export interface LateralCounterbalanceConfig {
	columnA: string;
	columnB: string;
	leftColumn: string;
	rightColumn: string;
}

export const defaultLateralCounterbalanceConfig = (): LateralCounterbalanceConfig => ({
	columnA: "image_a",
	columnB: "image_b",
	leftColumn: "image_left",
	rightColumn: "image_right",
});

export const getLateralCounterbalanceConfig = (
	screen: ScreenEntity
): LateralCounterbalanceConfig | undefined => {
	const behavior = screen.behaviors?.find((entry) => entry.kind === "LateralCounterbalance");
	if (!behavior || behavior.kind !== "LateralCounterbalance") {
		return undefined;
	}

	const { columnA, columnB, leftColumn, rightColumn } = behavior.props;
	if (!columnA?.trim() || !columnB?.trim() || !leftColumn?.trim() || !rightColumn?.trim()) {
		return undefined;
	}

	return {
		columnA: columnA.trim(),
		columnB: columnB.trim(),
		leftColumn: leftColumn.trim(),
		rightColumn: rightColumn.trim(),
	};
};

export const applyLateralCounterbalance = (
	row: SpreadsheetRow,
	config: LateralCounterbalanceConfig
): { row: SpreadsheetRow; presentation: LateralCounterbalancePresentation } => {
	const valueA = row.values[config.columnA] ?? "";
	const valueB = row.values[config.columnB] ?? "";
	const swapped = Math.random() < 0.5;
	const presentedLeft = swapped ? valueB : valueA;
	const presentedRight = swapped ? valueA : valueB;

	return {
		row: {
			...row,
			values: {
				...row.values,
				[config.leftColumn]: presentedLeft,
				[config.rightColumn]: presentedRight,
			},
		},
		presentation: {
			swapped,
			columnA: config.columnA,
			columnB: config.columnB,
			leftColumn: config.leftColumn,
			rightColumn: config.rightColumn,
			valueA,
			valueB,
			presentedLeft,
			presentedRight,
		},
	};
};

export const applyRowPresentationForStep = (
	row: SpreadsheetRow,
	step: ScreenEntity
): { row: SpreadsheetRow; presentation?: LateralCounterbalancePresentation } => {
	const config = getLateralCounterbalanceConfig(step);
	if (!config) {
		return { row };
	}

	return applyLateralCounterbalance(row, config);
};
