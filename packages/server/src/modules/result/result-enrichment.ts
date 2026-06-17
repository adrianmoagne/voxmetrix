import type {
	BindingRef,
	BlockEntity,
	Bound,
	ExperimentDefinition,
	ScreenChildEntity,
	ScreenEntity,
	SpreadsheetRow,
	StepEntity,
} from "../experiment/experiment-definition.types";

type JsonRecord = Record<string, unknown>;

interface LocatedStep {
	step: StepEntity;
	block: BlockEntity;
}

interface DefinitionIndexes {
	rowsByUid: Map<string, SpreadsheetRow>;
	rowIndexByUid: Map<string, number>;
	blocksByUid: Map<string, BlockEntity>;
	stepsByUid: Map<string, LocatedStep>;
}

const isRecord = (value: unknown): value is JsonRecord => {
	return !!value && typeof value === "object" && !Array.isArray(value);
};

const isBinding = <T>(value: Bound<T> | undefined): value is BindingRef<T> => {
	return (
		isRecord(value) &&
		value.kind === "binding" &&
		typeof value.column === "string"
	);
};

const normalizeString = (value: unknown): string | undefined => {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: undefined;
};

const toFiniteNumber = (value: unknown): number | undefined => {
	const numberValue = Number(value);
	return Number.isFinite(numberValue) ? numberValue : undefined;
};

const roundMetric = (value: number): number => Number(value.toFixed(2));

const durationBetween = (
	startValue: unknown,
	endValue: unknown
): number | undefined => {
	const start = toFiniteNumber(startValue);
	const end = toFiniteNumber(endValue);

	if (start === undefined || end === undefined) {
		return undefined;
	}

	return roundMetric(Math.max(0, end - start));
};

const resolveBound = <T>(
	value: Bound<T> | undefined,
	row?: SpreadsheetRow
): T | undefined => {
	if (value === undefined) return undefined;
	if (!isBinding(value)) return value;

	const resolved = row?.values?.[value.column];
	if (resolved !== undefined) return resolved as unknown as T;
	if (value.fallback !== undefined) return value.fallback;
	return undefined;
};

const buildDefinitionIndexes = (
	definition: ExperimentDefinition
): DefinitionIndexes => {
	const rowsByUid = new Map<string, SpreadsheetRow>();
	const rowIndexByUid = new Map<string, number>();
	const blocksByUid = new Map<string, BlockEntity>();
	const stepsByUid = new Map<string, LocatedStep>();

	definition.spreadsheet.rows.forEach((row, index) => {
		rowsByUid.set(row.uid, row);
		rowIndexByUid.set(row.uid, index);
	});

	for (const block of definition.blocks) {
		blocksByUid.set(block.uid, block);

		for (const step of block.steps) {
			if (!stepsByUid.has(step.uid)) {
				stepsByUid.set(step.uid, { step, block });
			}
		}
	}

	return { rowsByUid, rowIndexByUid, blocksByUid, stepsByUid };
};

const locateStep = (
	screenUid: string | undefined,
	row: SpreadsheetRow | undefined,
	indexes: DefinitionIndexes
): LocatedStep | undefined => {
	if (!screenUid) return undefined;

	if (row) {
		const rowBlock = indexes.blocksByUid.get(row.blockUid);
		const rowStep = rowBlock?.steps.find((step) => step.uid === screenUid);

		if (rowBlock && rowStep) {
			return { block: rowBlock, step: rowStep };
		}
	}

	return indexes.stepsByUid.get(screenUid);
};

const isScreenEntity = (step: StepEntity | undefined): step is ScreenEntity => {
	return step?.kind === "Screen";
};

const getResponses = (step: JsonRecord): JsonRecord => {
	return isRecord(step.responses) ? step.responses : {};
};

const getAudioTelemetry = (step: JsonRecord): JsonRecord => {
	return isRecord(step.audioTelemetry) ? step.audioTelemetry : {};
};

const buildRowContext = (
	row: SpreadsheetRow | undefined,
	indexes: DefinitionIndexes
) => {
	if (!row) return undefined;

	return {
		uid: row.uid,
		index: indexes.rowIndexByUid.get(row.uid),
		blockUid: row.blockUid,
		values: { ...row.values },
		condition: row.condition,
		shuffleGroup: row.shuffleGroup,
		fixed: row.fixed,
	};
};

const buildAudioContexts = (
	screen: ScreenEntity | undefined,
	row: SpreadsheetRow | undefined,
	step: JsonRecord
) => {
	if (!screen) return [];

	const audioTelemetry = getAudioTelemetry(step);

	return screen.children
		.filter((child) => child.kind === "AudioPlayer")
		.map((child) => {
			const telemetry = audioTelemetry[child.uid];
			const telemetryRecord = isRecord(telemetry) ? telemetry : undefined;

			return {
				entityUid: child.uid,
				name: child.name,
				kind: child.kind,
				label: resolveBound(child.props.label, row),
				source: resolveBound(child.props.audioSrc, row),
				telemetry,
				listenDurationMs: telemetryRecord
					? durationBetween(
							telemetryRecord.startedAtMs,
							telemetryRecord.completedAtMs
					  )
					: undefined,
			};
		});
};

const getResponsePrompt = (
	child: ScreenChildEntity,
	row: SpreadsheetRow | undefined
) => {
	if (child.kind === "RatingScale") {
		return resolveBound(child.props.prompt, row);
	}

	return undefined;
};

const getResponseText = (
	child: ScreenChildEntity,
	row: SpreadsheetRow | undefined
) => {
	if (child.kind === "TextHighlighter") {
		return resolveBound(child.props.text, row);
	}

	return undefined;
};

const getResponseScale = (
	child: ScreenChildEntity,
	row: SpreadsheetRow | undefined
) => {
	if (child.kind === "RatingScale") {
		return resolveBound(child.props.scale, row);
	}

	return undefined;
};

const buildKnownResponseItem = (
	child: ScreenChildEntity,
	row: SpreadsheetRow | undefined,
	value: unknown
) => {
	const scale = getResponseScale(child, row);
	const selectedIndex = Array.isArray(scale)
		? scale.findIndex((option) => String(option) === String(value))
		: undefined;

	return {
		entityUid: child.uid,
		name: child.name,
		kind: child.kind,
		prompt: getResponsePrompt(child, row),
		text: getResponseText(child, row),
		scale,
		value,
		selectedIndex:
			selectedIndex !== undefined && selectedIndex >= 0
				? selectedIndex
				: undefined,
	};
};

const buildResponseItemContexts = (
	screen: ScreenEntity | undefined,
	row: SpreadsheetRow | undefined,
	step: JsonRecord
) => {
	const responses = getResponses(step);
	const responseChildren = new Map<string, ScreenChildEntity>();

	if (screen) {
		for (const child of screen.children) {
			if (child.kind === "RatingScale" || child.kind === "TextHighlighter") {
				responseChildren.set(child.uid, child);
			}
		}
	}

	return Object.entries(responses).map(([entityUid, value]) => {
		const child = responseChildren.get(entityUid);

		if (child) {
			return buildKnownResponseItem(child, row, value);
		}

		return {
			entityUid,
			kind: "Unknown",
			value,
		};
	});
};

const enrichStep = (
	rawStep: unknown,
	indexes: DefinitionIndexes
): JsonRecord => {
	const step = isRecord(rawStep) ? rawStep : { value: rawStep };
	const screenUid = normalizeString(step.screenUid);
	const rowUid = normalizeString(step.rowUid);
	const row = rowUid ? indexes.rowsByUid.get(rowUid) : undefined;
	const locatedStep = locateStep(screenUid, row, indexes);
	const contextBlock =
		locatedStep?.block ?? (row ? indexes.blocksByUid.get(row.blockUid) : undefined);
	const screen = isScreenEntity(locatedStep?.step) ? locatedStep.step : undefined;

	const enrichedStep: JsonRecord = {
		...step,
		timing: {
			durationMs: durationBetween(step.startedAt, step.completedAt),
		},
		audios: buildAudioContexts(screen, row, step),
		responseItems: buildResponseItemContexts(screen, row, step),
	};

	if (isRecord(step.presentation)) {
		enrichedStep.presentation = step.presentation;
	}

	if (contextBlock) {
		enrichedStep.block = {
			uid: contextBlock.uid,
			name: contextBlock.name,
		};
	}

	if (locatedStep) {
		enrichedStep.screen = {
			uid: locatedStep.step.uid,
			name: locatedStep.step.name,
			kind: locatedStep.step.kind,
		};
	}

	const rowContext = buildRowContext(row, indexes);
	if (rowContext) {
		enrichedStep.row = rowContext;
	}

	return enrichedStep;
};

export const enrichResultSteps = (
	steps: unknown[],
	definition: ExperimentDefinition
): JsonRecord[] => {
	const indexes = buildDefinitionIndexes(definition);
	return steps.map((step) => enrichStep(step, indexes));
};
