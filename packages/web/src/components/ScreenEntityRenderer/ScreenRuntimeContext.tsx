import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
	ScreenPhase,
	ScreenRuntime,
	ScreenChildEntity,
	ScreenBehaviorEntity,
	AdvanceRequest,
	ScreenCompletionData,
	AudioRuntimeState,
	ResponseRuntimeState,
	ResponseTelemetry,
} from "../../@types/screen.model";

const ScreenRuntimeContext = createContext<ScreenRuntime | null>(null);

export function useScreenRuntime(): ScreenRuntime {
	const ctx = useContext(ScreenRuntimeContext);
	if (!ctx) throw new Error("useScreenRuntime must be used within ScreenRuntimeProvider");
	return ctx;
}

function resolveStimulusPhase(audioCount: number, responseCount: number): ScreenPhase {
	if (audioCount === 0 && responseCount === 0) return "ready";
	if (audioCount === 0) return "response";
	return "stimulus";
}

const emptyAudioState = (): AudioRuntimeState => ({
	started: false,
	completed: false,
	playCount: 0,
	pauseCount: 0,
	listenedMs: 0,
});

const emptyResponseState = (): ResponseRuntimeState => ({
	completed: false,
	selectionCount: 0,
});

const closeListeningInterval = (state: AudioRuntimeState, now: number): AudioRuntimeState => {
	if (state.playingSinceMs === undefined) return state;
	return {
		...state,
		listenedMs: state.listenedMs + Math.max(0, now - state.playingSinceMs),
		playingSinceMs: undefined,
	};
};

function buildRuntimeSnapshot(
	entityChildren: ScreenChildEntity[],
	behaviors: ScreenBehaviorEntity[]
) {
	const audioEntities = entityChildren.filter((child) => child.kind === "AudioPlayer");
	const responseEntities = entityChildren.filter(
		(child) => child.kind === "RatingScale" || child.kind === "TextHighlighter"
	);
	const hasFixationGate = behaviors.some((behavior) => behavior.kind === "FixationGate");
	const hasEyeTracking = behaviors.some((behavior) => behavior.kind === "EyeTracking");

	const audioStates: Record<string, AudioRuntimeState> = {};
	for (const entity of audioEntities) {
		audioStates[entity.uid] = emptyAudioState();
	}

	const responseStates: Record<string, ResponseRuntimeState> = {};
	for (const entity of responseEntities) {
		responseStates[entity.uid] = emptyResponseState();
	}

	const phase = hasFixationGate
		? "stimulus"
		: resolveStimulusPhase(audioEntities.length, responseEntities.length);

	return {
		audioEntities,
		responseEntities,
		hasEyeTracking,
		phase,
		audioStates,
		responseStates,
		fixationActive: hasFixationGate,
	};
}

interface ScreenRuntimeProviderProps {
	screenUid: string;
	rowUid?: string;
	children: ScreenChildEntity[];
	behaviors?: ScreenBehaviorEntity[];
	onComplete: (data: ScreenCompletionData) => void;
	reactChildren: React.ReactNode;
}

export const ScreenRuntimeProvider: React.FC<ScreenRuntimeProviderProps> = ({
	screenUid,
	rowUid,
	children: entityChildren,
	behaviors = [],
	onComplete,
	reactChildren,
}) => {
	const [initialSnapshot] = useState(() => buildRuntimeSnapshot(entityChildren, behaviors));
	const { audioEntities, responseEntities, hasEyeTracking } = initialSnapshot;

	const startedAtRef = useRef(performance.now());
	const completedRef = useRef(false);
	const completionExtrasRef = useRef<ScreenCompletionData["extras"]>(undefined);

	const [phase, setPhase] = useState(initialSnapshot.phase);
	const [audioStates, setAudioStates] = useState(initialSnapshot.audioStates);
	const [responseStates, setResponseStates] = useState(initialSnapshot.responseStates);
	const [fixationActive, setFixationActive] = useState(initialSnapshot.fixationActive);
	const [pendingAdvanceRequest, setPendingAdvanceRequest] = useState<AdvanceRequest | null>(null);
	const pendingAdvanceRequestRef = useRef<AdvanceRequest | null>(null);

	const clearFixation = useCallback(() => {
		setFixationActive(false);
		setPhase((prev) => {
			if (prev !== "stimulus") return prev;
			return resolveStimulusPhase(audioEntities.length, responseEntities.length);
		});
	}, [audioEntities.length, responseEntities.length]);

	const markAudioStarted = useCallback((entityUid: string, fromStart: boolean) => {
		const now = performance.now();
		setAudioStates((prev) => {
			const currentState = prev[entityUid] ?? emptyAudioState();
			if (currentState.playingSinceMs !== undefined) {
				return prev;
			}

			return {
				...prev,
				[entityUid]: {
					...currentState,
					started: true,
					startedAtMs: currentState.startedAtMs ?? now,
					playCount: currentState.playCount + (fromStart ? 1 : 0),
					playingSinceMs: now,
				},
			};
		});
	}, []);

	const markAudioPaused = useCallback((entityUid: string) => {
		const now = performance.now();
		setAudioStates((prev) => {
			const currentState = prev[entityUid];
			if (!currentState || currentState.playingSinceMs === undefined) {
				return prev;
			}

			return {
				...prev,
				[entityUid]: {
					...closeListeningInterval(currentState, now),
					pauseCount: currentState.pauseCount + 1,
				},
			};
		});
	}, []);

	const markAudioCompleted = useCallback(
		(entityUid: string) => {
			const now = performance.now();
			setAudioStates((prev) => {
				const currentState = closeListeningInterval(prev[entityUid] ?? emptyAudioState(), now);
				const next = {
					...prev,
					[entityUid]: {
						...currentState,
						started: true,
						completed: true,
						startedAtMs: currentState.startedAtMs ?? now,
						completedAtMs: currentState.completedAtMs ?? now,
					},
				};
				const allDone = Object.values(next).every((s) => s.completed);
				if (allDone) {
					setPhase((currentPhase) => {
						if (currentPhase !== "stimulus") return currentPhase;
						return resolveStimulusPhase(0, responseEntities.length);
					});
				}
				return next;
			});
		},
		[responseEntities.length]
	);

	const markResponseSelected = useCallback((entityUid: string) => {
		const now = performance.now();
		setResponseStates((prev) => {
			const currentState = prev[entityUid] ?? emptyResponseState();
			if (currentState.completed) return prev;

			return {
				...prev,
				[entityUid]: {
					...currentState,
					selectionCount: currentState.selectionCount + 1,
					firstSelectedAtMs: currentState.firstSelectedAtMs ?? now,
				},
			};
		});
	}, []);

	const markResponseCompleted = useCallback(
		(entityUid: string, value: unknown) => {
			const now = performance.now();
			setResponseStates((prev) => {
				const currentState = prev[entityUid] ?? emptyResponseState();
				const next = {
					...prev,
					[entityUid]: { ...currentState, completed: true, value, completedAtMs: now },
				};
				const allDone = Object.values(next).every((s) => s.completed);
				if (allDone) {
					setPhase((currentPhase) =>
						currentPhase === "response" ? "ready" : currentPhase
					);
				}
				return next;
			});
		},
		[]
	);

	const requestAdvance = useCallback((request: AdvanceRequest) => {
		if (completedRef.current || pendingAdvanceRequestRef.current) return;

		pendingAdvanceRequestRef.current = request;
		setPendingAdvanceRequest(request);
	}, []);

	const finalizeAdvance = useCallback(() => {
		if (completedRef.current || !pendingAdvanceRequestRef.current) return;
		completedRef.current = true;

		const responses: Record<string, unknown> = {};
		const responseTelemetry: Record<string, ResponseTelemetry> = {};
		for (const [uid, state] of Object.entries(responseStates)) {
			if (state.completed && state.value !== undefined) {
				responses[uid] = state.value;
			}
			responseTelemetry[uid] = {
				selectionCount: state.selectionCount,
				firstSelectedAtMs: state.firstSelectedAtMs,
				completedAtMs: state.completedAtMs,
			};
		}

		// Audio still playing when the participant advanced counts up to now.
		const finishedAt = performance.now();
		const audioTelemetry: Record<string, AudioRuntimeState> = {};
		for (const [uid, state] of Object.entries(audioStates)) {
			const { playingSinceMs: _playingSinceMs, ...telemetry } = closeListeningInterval(
				state,
				finishedAt
			);
			audioTelemetry[uid] = telemetry;
		}

		onComplete({
			screenUid,
			rowUid,
			advanceReason: pendingAdvanceRequestRef.current.reason,
			startedAt: startedAtRef.current,
			completedAt: performance.now(),
			responses,
			audioTelemetry,
			responseTelemetry,
			extras: completionExtrasRef.current,
		});
	}, [audioStates, onComplete, responseStates, rowUid, screenUid]);

	const setCompletionExtras = useCallback(
		(extras: NonNullable<ScreenCompletionData["extras"]>) => {
			completionExtrasRef.current = {
				...completionExtrasRef.current,
				...extras,
			};
		},
		[]
	);

	useEffect(() => {
		if (pendingAdvanceRequest && !hasEyeTracking) {
			finalizeAdvance();
		}
	}, [finalizeAdvance, hasEyeTracking, pendingAdvanceRequest]);

	const isEntityVisible = useCallback(
		(_entityUid: string) => {
			if (fixationActive) return false;
			return true;
		},
		[fixationActive]
	);

	const isEntityInteractive = useCallback(
		(entityUid: string) => {
			const child = entityChildren.find((c) => c.uid === entityUid);
			if (!child) return false;

			const entityPhase = child.phase;
			if (!entityPhase || entityPhase === "all") return true;

			if (entityPhase === "stimulus") return true;
			if (entityPhase === "response") return phase !== "stimulus";
			if (entityPhase === "ready") return phase === "ready";
			return true;
		},
		[entityChildren, phase]
	);

	const runtime = useMemo<ScreenRuntime>(
		() => ({
			phase,
			audioStates,
			responseStates,
			fixationActive,
			pendingAdvanceRequest,
			markAudioStarted,
			markAudioPaused,
			markAudioCompleted,
			markResponseSelected,
			markResponseCompleted,
			requestAdvance,
			finalizeAdvance,
			setCompletionExtras,
			clearFixation,
			isEntityVisible,
			isEntityInteractive,
		}),
		[
			phase,
			audioStates,
			responseStates,
			fixationActive,
			pendingAdvanceRequest,
			markAudioStarted,
			markAudioPaused,
			markAudioCompleted,
			markResponseSelected,
			markResponseCompleted,
			requestAdvance,
			finalizeAdvance,
			setCompletionExtras,
			clearFixation,
			isEntityVisible,
			isEntityInteractive,
		]
	);

	return (
		<ScreenRuntimeContext.Provider value={runtime}>
			{reactChildren}
		</ScreenRuntimeContext.Provider>
	);
};

export { ScreenRuntimeContext, type ScreenRuntimeProviderProps };
