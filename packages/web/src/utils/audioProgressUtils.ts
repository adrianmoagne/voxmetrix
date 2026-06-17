import type { ScreenEntity, SpreadsheetRow, StepEntity } from "@/@types/screen.model";

export interface AudioProgressExecutionStep {
	index: number;
	step: StepEntity;
	row: SpreadsheetRow;
}

export interface AudioProgressState {
	current: number;
	total: number;
}

export function screenHasAudioProgress(screen: ScreenEntity): boolean {
	return screen.behaviors?.some((behavior) => behavior.kind === "AudioProgress") ?? false;
}

export function getAudioProgressQueueIndices(queue: AudioProgressExecutionStep[]): number[] {
	return queue.reduce<number[]>((indices, entry, index) => {
		if (entry.step.kind !== "Screen") return indices;
		if (!screenHasAudioProgress(entry.step)) return indices;
		indices.push(index);
		return indices;
	}, []);
}

export function getAudioProgressForStep(
	queue: AudioProgressExecutionStep[],
	currentIndex: number
): AudioProgressState | null {
	const indices = getAudioProgressQueueIndices(queue);
	if (indices.length === 0) return null;

	const position = indices.indexOf(currentIndex);
	if (position === -1) return null;

	return {
		current: position + 1,
		total: indices.length,
	};
}
