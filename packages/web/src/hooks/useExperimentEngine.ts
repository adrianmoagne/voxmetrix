import { useState, useCallback, useRef, useMemo } from "react";
import type {
	ExperimentDefinition,
	ScreenEntity,
	StepEntity,
	SpreadsheetRow,
	ScreenCompletionData,
	LateralCounterbalancePresentation,
	StimulusShufflePresentation,
} from "@/@types/screen.model";
import { defaultCalibrationConfig } from "@/@types/screen.model";
import { checkValidationFailed, type ValidationResponse } from "@/utils/validationUtils";
import {
	getAudioProgressForStep,
	type AudioProgressState,
} from "@/utils/audioProgressUtils";
import { applyRowPresentationForStep } from "@/utils/lateralCounterbalanceUtils";
import { applyStimulusShuffle } from "@/utils/stimulusShuffleUtils";

const EYE_TRACKING_STEP_KINDS = new Set(["CalibrationStep", "ValidationStep"]);

export function stepNeedsEyeTracking(step: StepEntity): boolean {
	if (EYE_TRACKING_STEP_KINDS.has(step.kind)) {
		return true;
	}

	if (step.kind === "Screen") {
		const screen = step as ScreenEntity;
		return screen.behaviors?.some((b) => b.kind === "EyeTracking") ?? false;
	}

	return false;
}

/** True if any step in the definition uses eye tracking (e.g. welcome copy). */
export function definitionNeedsEyeTracking(definition: ExperimentDefinition): boolean {
	for (const block of definition.blocks) {
		for (const step of block.steps) {
			if (stepNeedsEyeTracking(step)) {
				return true;
			}
		}
	}

	return false;
}

// --- Execution queue ---

export interface ExecutionStep {
	index: number;
	/** Position in the queue as first built; unset for steps inserted later (recalibration). */
	planIndex?: number;
	step: StepEntity;
	row: SpreadsheetRow;
	presentation?: LateralCounterbalancePresentation;
	shuffle?: StimulusShufflePresentation;
}

function shuffleRows(
	rows: SpreadsheetRow[],
	mode: string | undefined,
	random: () => number
): SpreadsheetRow[] {
	if (!mode || mode === "none") return rows;

	const result = [...rows];
	const groups = new Map<string, number[]>();

	// Collect indices per shuffleGroup, skipping fixed rows
	for (let i = 0; i < result.length; i++) {
		const row = result[i];
		if (row.fixed) continue;
		const group = row.shuffleGroup ?? "__default__";
		if (!groups.has(group)) groups.set(group, []);
		groups.get(group)!.push(i);
	}

	// Fisher-Yates shuffle within each group
	for (const indices of groups.values()) {
		for (let i = indices.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			const a = indices[i];
			const b = indices[j];
			[result[a], result[b]] = [result[b], result[a]];
		}
	}

	return result;
}

function filterRowsByCondition(
	rows: SpreadsheetRow[],
	participantCondition: string | undefined,
	assignmentEnabled: boolean
): SpreadsheetRow[] {
	if (!assignmentEnabled) {
		return rows;
	}

	if (!participantCondition) {
		return [];
	}

	return rows.filter((row) => {
		const rowCondition = row.condition?.trim();
		if (!rowCondition) {
			return true;
		}

		return rowCondition === participantCondition;
	});
}

export interface BuildExecutionQueueOptions {
	participantCondition?: string;
	/** Source of every random choice; a seeded one makes the queue reproducible. */
	random?: () => number;
}

export function buildExecutionQueue(
	definition: ExperimentDefinition,
	options: BuildExecutionQueueOptions = {}
): ExecutionStep[] {
	const random = options.random ?? Math.random;
	const blockMap = new Map(definition.blocks.map((b) => [b.uid, b]));
	const assignmentEnabled = definition.participantAssignment?.enabled === true;
	const filteredRows = filterRowsByCondition(
		definition.spreadsheet.rows,
		options.participantCondition,
		assignmentEnabled
	);
	const rows = shuffleRows(filteredRows, definition.spreadsheet.shuffleMode, random);
	const queue: ExecutionStep[] = [];

	let index = 0;
	for (const row of rows) {
		const block = blockMap.get(row.blockUid);
		if (!block) continue;

		for (const step of block.steps) {
			// Legacy editor steps — camera setup runs automatically before the experiment.
			if ((step.kind as string) === "CameraInitStep") continue;

			if (step.kind === "Screen") {
				const { row: presentationRow, presentation } = applyRowPresentationForStep(
					row,
					step,
					random
				);
				const { screen: trialStep, shuffle } = applyStimulusShuffle(
					step,
					presentationRow,
					random
				);
				queue.push({
					index,
					planIndex: index++,
					step: trialStep,
					row: presentationRow,
					presentation,
					shuffle,
				});
				continue;
			}

			queue.push({ index, planIndex: index++, step, row });
		}
	}

	return queue;
}

export function reindexQueue(steps: ExecutionStep[]): ExecutionStep[] {
	return steps.map((entry, index) => ({ ...entry, index }));
}

export function buildRecalibrationSteps(row: SpreadsheetRow): ExecutionStep[] {
	const timestamp = Date.now();
	const steps: StepEntity[] = [
		{
			uid: `recalibration-${timestamp}`,
			kind: "CalibrationStep",
			name: "Recalibration",
			props: {},
		},
		{
			uid: `revalidation-${timestamp}`,
			kind: "ValidationStep",
			name: "Re-validation",
			props: {},
		},
	];

	return steps.map((step, index) => ({
		index,
		step,
		row,
	}));
}

/**
 * Queue for a session resumed at `resumeIndex`. A reload loses the camera calibration,
 * so one is inserted before the resumed step unless the next eye-tracking step is itself
 * a calibration.
 */
export function withResumeRecalibration(
	definition: ExperimentDefinition,
	queue: ExecutionStep[],
	resumeIndex: number
): ExecutionStep[] {
	const resumeStep = queue[resumeIndex];
	if (!resumeStep || !definitionNeedsEyeTracking(definition)) return queue;

	const nextEyeTrackingStep = queue
		.slice(resumeIndex)
		.find((entry) => stepNeedsEyeTracking(entry.step));
	if (!nextEyeTrackingStep || nextEyeTrackingStep.step.kind === "CalibrationStep") return queue;

	return reindexQueue([
		...queue.slice(0, resumeIndex),
		...buildRecalibrationSteps(resumeStep.row),
		...queue.slice(resumeIndex),
	]);
}

// --- Engine hook ---

export interface ExperimentEngineReturn {
	currentStep: ExecutionStep | null;
	currentIndex: number;
	totalSteps: number;
	results: ScreenCompletionData[];
	completeStep: (data: ScreenCompletionData) => void;
	isComplete: boolean;
	needsRecalibration: boolean;
	triggerRecalibration: () => void;
	audioProgress: AudioProgressState | null;
}

interface UseExperimentEngineOptions {
	definition: ExperimentDefinition;
	participantCondition?: string;
	/** Prebuilt queue (e.g. from a session seed); built from the definition otherwise. */
	initialQueue?: ExecutionStep[];
	/** Queue index to start at, for a resumed session. */
	startIndex?: number;
	/** Called once per completed step, in order, as soon as it completes. */
	onStepComplete?: (data: ScreenCompletionData) => void;
	/** Called after the last step with the steps completed in this run. */
	onFinish?: (results: ScreenCompletionData[]) => void;
}

export function useExperimentEngine({
	definition,
	participantCondition,
	initialQueue,
	startIndex = 0,
	onStepComplete,
	onFinish,
}: UseExperimentEngineOptions): ExperimentEngineReturn {
	const [queue, setQueue] = useState(
		() => initialQueue ?? buildExecutionQueue(definition, { participantCondition })
	);
	const [currentIndex, setCurrentIndex] = useState(startIndex);
	const currentIndexRef = useRef(startIndex);
	const [results, setResults] = useState<ScreenCompletionData[]>([]);
	const resultsRef = useRef<ScreenCompletionData[]>([]);
	const [isComplete, setIsComplete] = useState(false);
	const [needsRecalibration, setNeedsRecalibration] = useState(false);
	const pendingValidationResultRef = useRef<ScreenCompletionData | null>(null);
	const queueLengthRef = useRef(queue.length);
	queueLengthRef.current = queue.length;
	const onFinishRef = useRef(onFinish);
	onFinishRef.current = onFinish;
	const onStepCompleteRef = useRef(onStepComplete);
	onStepCompleteRef.current = onStepComplete;

	const currentStep = currentIndex < queue.length ? queue[currentIndex] : null;
	const audioProgress = useMemo(
		() => getAudioProgressForStep(queue, currentIndex),
		[queue, currentIndex]
	);

	// Callbacks run here, not inside state updaters, so they fire exactly once per step.
	const advanceStep = useCallback(
		(data: ScreenCompletionData, completionQueueLength?: number) => {
			const targetLength = completionQueueLength ?? queueLengthRef.current;
			const nextIndex = currentIndexRef.current + 1;
			currentIndexRef.current = nextIndex;

			const newResults = [...resultsRef.current, data];
			resultsRef.current = newResults;
			setResults(newResults);
			onStepCompleteRef.current?.(data);

			if (nextIndex >= targetLength) {
				setIsComplete(true);
				onFinishRef.current?.(newResults);
			}

			setCurrentIndex(nextIndex);
		},
		[]
	);

	const completeStep = useCallback(
		(data: ScreenCompletionData) => {
			const executionStep = queue[currentIndex];
			const step = executionStep?.step;
			const mergedData: ScreenCompletionData = {
				...data,
				planIndex: executionStep?.planIndex,
				presentation: data.presentation ?? executionStep?.presentation,
				shuffle: data.shuffle ?? executionStep?.shuffle,
			};

			if (step?.kind === "ValidationStep") {
				const validationResponse = mergedData.responses?.validation as
					| ValidationResponse
					| undefined;
				if (checkValidationFailed(validationResponse, defaultCalibrationConfig)) {
					pendingValidationResultRef.current = mergedData;
					setNeedsRecalibration(true);
					return;
				}
			}

			advanceStep(mergedData);
		},
		[advanceStep, currentIndex, queue]
	);

	const triggerRecalibration = useCallback(() => {
		const pendingResult = pendingValidationResultRef.current;
		const current = queue[currentIndex];
		if (!current) return;

		setNeedsRecalibration(false);
		pendingValidationResultRef.current = null;

		const recalSteps = buildRecalibrationSteps(current.row);
		const insertAt = currentIndex + 1;
		const mergedQueue = reindexQueue([
			...queue.slice(0, insertAt),
			...recalSteps,
			...queue.slice(insertAt),
		]);
		setQueue(mergedQueue);

		if (pendingResult) {
			advanceStep(pendingResult, mergedQueue.length);
		}
	}, [advanceStep, currentIndex, queue]);

	return {
		currentStep,
		currentIndex,
		totalSteps: queue.length,
		results,
		completeStep,
		isComplete,
		needsRecalibration,
		triggerRecalibration,
		audioProgress,
	};
}
