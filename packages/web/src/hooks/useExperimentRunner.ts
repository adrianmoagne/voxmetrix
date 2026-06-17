import { useState, useCallback, useRef } from "react";
import type { IScreen } from "@/@types";

export interface Trial {
	id: string;
	type:
		| "screen"
		| "audio-rating"
		| "text-highlighting"
		| "form"
		| "calibration"
		| "validation"
		| "fixation"
		| "feedback"
		| "instruction"
		| "camera-init";
	screen?: IScreen;
	audioSource?: string;
	duration?: number;
	metadata: Record<string, any>;
}

interface GazePoint {
	x: number;
	y: number;
	t: number;
}

export interface TargetBoundingBox {
	imageId: string;
	filename: string;
	boundingBox: { left: number; right: number; top: number; bottom: number };
}

export interface TrialResult {
	trialId: string;
	trialIndex: number;
	type: string;
	response: any;
	rt: number;
	startedAt: number;
	gazeData?: GazePoint[];
	targetBoundingBoxes?: TargetBoundingBox[];
	metadata: Record<string, any>;
}

export interface UseExperimentRunnerReturn {
	currentTrial: Trial | null;
	currentTrialIndex: number;
	totalTrials: number;
	trialStartTime: number;
	results: TrialResult[];
	completeTrial: (response: any, extras?: Partial<TrialResult>) => void;
	isFinished: boolean;
}

interface UseExperimentRunnerOptions {
	trials: Trial[];
	onFinish?: (results: TrialResult[]) => void;
}

export const useExperimentRunner = ({
	trials,
	onFinish,
}: UseExperimentRunnerOptions): UseExperimentRunnerReturn => {
	const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
	const [results, setResults] = useState<TrialResult[]>([]);
	const [isFinished, setIsFinished] = useState(false);
	const [trialStartTime, setTrialStartTime] = useState(() => performance.now());
	const onFinishRef = useRef(onFinish);
	onFinishRef.current = onFinish;

	const currentTrial = currentTrialIndex < trials.length ? trials[currentTrialIndex] : null;

	const completeTrial = useCallback(
		(response: any, extras?: Partial<TrialResult>) => {
			const now = performance.now();
			const trial = trials[currentTrialIndex];
			if (!trial) return;

			const result: TrialResult = {
				trialId: trial.id,
				trialIndex: currentTrialIndex,
				type: trial.type,
				response,
				rt: Math.round(now - trialStartTime),
				startedAt: trialStartTime,
				metadata: trial.metadata,
				...extras,
			};

			const newResults = [...results, result];
			setResults(newResults);

			const nextIndex = currentTrialIndex + 1;
			if (nextIndex >= trials.length) {
				setIsFinished(true);
				onFinishRef.current?.(newResults);
			} else {
				setCurrentTrialIndex(nextIndex);
				setTrialStartTime(performance.now());
			}
		},
		[currentTrialIndex, trialStartTime, results, trials]
	);

	return {
		currentTrial,
		currentTrialIndex,
		totalTrials: trials.length,
		trialStartTime,
		results,
		completeTrial,
		isFinished,
	};
};

export default useExperimentRunner;
