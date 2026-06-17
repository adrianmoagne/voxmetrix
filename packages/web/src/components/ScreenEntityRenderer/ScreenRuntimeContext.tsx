import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
	ScreenPhase,
	ScreenRuntime,
	ScreenChildEntity,
	ScreenBehaviorEntity,
	AdvanceRequest,
	ScreenCompletionData,
	AudioRuntimeState,
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
		audioStates[entity.uid] = { started: false, completed: false };
	}

	const responseStates: Record<string, { completed: boolean; value?: unknown }> = {};
	for (const entity of responseEntities) {
		responseStates[entity.uid] = { completed: false };
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

	const markAudioStarted = useCallback((entityUid: string) => {
		setAudioStates((prev) => {
			const currentState = prev[entityUid];
			if (currentState?.started) {
				return prev;
			}

			return {
				...prev,
				[entityUid]: {
					started: true,
					completed: currentState?.completed ?? false,
					startedAtMs: performance.now(),
					completedAtMs: currentState?.completedAtMs,
				},
			};
		});
	}, []);

	const markAudioCompleted = useCallback(
		(entityUid: string) => {
			setAudioStates((prev) => {
				const currentState = prev[entityUid];
				const next = {
					...prev,
					[entityUid]: {
						started: true,
						completed: true,
						startedAtMs: currentState?.startedAtMs ?? performance.now(),
						completedAtMs: currentState?.completedAtMs ?? performance.now(),
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

	const markResponseCompleted = useCallback(
		(entityUid: string, value: unknown) => {
			setResponseStates((prev) => {
				const next = { ...prev, [entityUid]: { completed: true, value } };
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
		for (const [uid, state] of Object.entries(responseStates)) {
			if (state.completed && state.value !== undefined) {
				responses[uid] = state.value;
			}
		}

		onComplete({
			screenUid,
			rowUid,
			advanceReason: pendingAdvanceRequestRef.current.reason,
			startedAt: startedAtRef.current,
			completedAt: performance.now(),
			responses,
			audioTelemetry: audioStates,
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
			markAudioCompleted,
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
			markAudioCompleted,
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
