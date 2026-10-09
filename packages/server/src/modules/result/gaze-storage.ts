import { decodeStored, encodeStored } from "./gaze-columns";

type JsonRecord = Record<string, unknown>;

/** Where a step's gaze samples went, left in its `extras` in place of them. */
export interface GazeSummary {
	storage: "gaze-capture";
	sampleCount: number;
	/** Samples with a gaze position (a face was found and inference succeeded). */
	validSampleCount: number;
}

export interface SplitGazeCapture {
	stepIndex: number;
	screenUid?: string;
	rowUid?: string;
	/** Samples in compact columnar form (see `gaze-columns`). */
	samples: unknown;
	capture?: unknown;
}

export interface StoredGazeCapture {
	stepIndex: number;
	/** A plain array in captures stored before columnar encoding. */
	samples?: unknown;
	capture?: unknown;
}

const isRecord = (value: unknown): value is JsonRecord =>
	!!value && typeof value === "object" && !Array.isArray(value);

const optionalString = (value: unknown): string | undefined =>
	typeof value === "string" ? value : undefined;

const hasGazePosition = (sample: unknown): boolean =>
	isRecord(sample) && typeof sample.x === "number" && typeof sample.y === "number";

/** Per-frame arrays in the capture metadata (clock anchors, skipped frames) get the same encoding. */
const mapCaptureArrays = (capture: unknown, map: (value: unknown) => unknown): unknown => {
	if (!isRecord(capture)) return capture;
	return Object.fromEntries(Object.entries(capture).map(([key, value]) => [key, map(value)]));
};

const encodeCapture = (capture: unknown) =>
	mapCaptureArrays(capture, (value) => (Array.isArray(value) ? encodeStored(value) : value));

const decodeCapture = (capture: unknown) => mapCaptureArrays(capture, decodeStored);

/**
 * Moves `extras.gazeData` and `extras.gazeCapture` out of each step. The steps
 * returned carry a `GazeSummary` instead; the captures go to their own collection.
 */
export const splitGazeCaptures = (
	steps: JsonRecord[]
): { steps: JsonRecord[]; captures: SplitGazeCapture[] } => {
	const captures: SplitGazeCapture[] = [];

	const strippedSteps = steps.map((step, stepIndex) => {
		const extras = step.extras;
		if (!isRecord(extras)) return step;
		if (extras.gazeData === undefined && extras.gazeCapture === undefined) return step;

		const { gazeData, gazeCapture, ...remainingExtras } = extras;
		const samples = Array.isArray(gazeData) ? gazeData : [];
		captures.push({
			stepIndex,
			screenUid: optionalString(step.screenUid),
			rowUid: optionalString(step.rowUid),
			samples: encodeStored(samples),
			capture: encodeCapture(gazeCapture),
		});

		const gazeSummary: GazeSummary = {
			storage: "gaze-capture",
			sampleCount: samples.length,
			validSampleCount: samples.filter(hasGazePosition).length,
		};
		return { ...step, extras: { ...remainingExtras, gazeSummary } };
	});

	return { steps: strippedSteps, captures };
};

/** Puts stored captures back into the steps of a result, in the shape it was submitted. */
export const attachGazeCaptures = <T extends { steps?: unknown }>(
	result: T,
	captures: StoredGazeCapture[]
): T => {
	if (!Array.isArray(result.steps) || captures.length === 0) return result;

	const byStepIndex = new Map(captures.map((capture) => [capture.stepIndex, capture]));
	const steps = result.steps.map((step: unknown, stepIndex: number) => {
		const capture = byStepIndex.get(stepIndex);
		if (!capture || !isRecord(step)) return step;

		const extras = isRecord(step.extras) ? step.extras : {};
		return {
			...step,
			extras: {
				...extras,
				gazeData: decodeStored(capture.samples ?? []),
				...(capture.capture === undefined ? {} : { gazeCapture: decodeCapture(capture.capture) }),
			},
		};
	});

	return { ...result, steps };
};