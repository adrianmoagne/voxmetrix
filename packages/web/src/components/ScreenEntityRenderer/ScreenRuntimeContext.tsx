import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
	ScreenPhase,
	ScreenRuntime,
	ScreenChildEntity,
	ScreenBehaviorEntity,
	AdvanceRequest,
	ScreenCompletionData,
	AudioRuntimeState,
	AudioPlaybackTelemetry,
	ResponseTelemetry,
} from "../../@types/screen.model";

const ScreenRuntimeContext = createContext<ScreenRuntime | null>(null);

export function useScreenRuntime(): ScreenRuntime {
	const ctx = useContext(ScreenRuntimeContext);
	if (!ctx) throw new Error("useScreenRuntime must be used within ScreenRuntimeProvider");
	return ctx;
}

interface PlaybackRecord extends AudioPlaybackTelemetry {
	playingSinceMs?: number;
}

const playbackRecordFor = (records: Record<string, PlaybackRecord>, uid: string): PlaybackRecord =>
	(records[uid] ??= { playCount: 0, pauseCount: 0, listenedMs: 0 });

const responseRecordFor = (
	records: Record<string, ResponseTelemetry>,
	uid: string
): ResponseTelemetry => (records[uid] ??= { selectionCount: 0 });

const stopListening = (record: PlaybackRecord, now: number) => {
	if (record.playingSinceMs === undefined) return;
	record.listenedMs += Math.max(0, now - record.playingSinceMs);
	record.playingSinceMs = undefined;
};

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
	// Telemetry lives in refs, not state: eye tracking effects depend on audioStates and
	// responseStates, and extra updates there would restart gaze capture.
	const playbackRef = useRef<Record<string, PlaybackRecord>>({});
	const responseTelemetryRef = useRef<Record<string, ResponseTelemetry>>({});

	const [phase, setPhase] = useState(initialSnapshot.phase);
	const [audioStates, setAudioStates] = useState(initialSnapshot.audioStates);
	const [responseStates, setResponseStates] = useState(initialSnapshot.responseStates);
	const [fixationActive, setFixationActive] = useState(initialSnapshot.fixationActive);
	const [pendingAdvanceRequest, setPendingAdvanceRequest] = useState<AdvanceRequest | null>(null);
	const pendingAdvanceRequestRef = useRef<AdvanceRequest | null>(null);
	// Finalizing can wait for eye tracking to drain; completion is when the participant advanced.
	const advanceRequestedAtRef = useRef<number | null>(null);

	const clearFixation = useCallback(() => {
		setFixationActive(false);
		setPhase((prev) => {
			if (prev !== "stimulus") return prev;
			return resolveStimulusPhase(audioEntities.length, responseEntities.length);
		});
	}, [audioEntities.length, responseEntities.length]);

	const markAudioStarted = useCallback((entityUid: string, fromStart: boolean) => {
		const playback = playbackRecordFor(playbackRef.current, entityUid);
		if (playback.playingSinceMs === undefined) {
			if (fromStart) playback.playCount += 1;
			playback.playingSinceMs = performance.now();
		}

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

	const markAudioPaused = useCallback((entityUid: string) => {
		const playback = playbackRecordFor(playbackRef.current, entityUid);
		if (playback.playingSinceMs === undefined) return;
		stopListening(playback, performance.now());
		playback.pauseCount += 1;
	}, []);

	const markAudioCompleted = useCallback(
		(entityUid: string) => {
			stopListening(playbackRecordFor(playbackRef.current, entityUid), performance.now());
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

	const markResponseSelected = useCallback((entityUid: string) => {
		const record = responseRecordFor(responseTelemetryRef.current, entityUid);
		if (record.completedAtMs !== undefined) return;
		record.selectionCount += 1;
		record.firstSelectedAtMs ??= performance.now();
	}, []);

	const markResponseCompleted = useCallback(
		(entityUid: string, value: unknown) => {
			responseRecordFor(responseTelemetryRef.current, entityUid).completedAtMs ??=
				performance.now();
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
		advanceRequestedAtRef.current = performance.now();
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

		// Audio still playing when the participant advanced counts up to that moment, not up to
		// now: finalizing can wait for eye tracking to finish storing its capture.
		const advancedAt = pendingAdvanceRequestRef.current.at;
		const audioTelemetry: NonNullable<ScreenCompletionData["audioTelemetry"]> = {};
		for (const [uid, state] of Object.entries(audioStates)) {
			const { playingSinceMs, ...playback } = playbackRecordFor(playbackRef.current, uid);
			const stillPlayingMs =
				playingSinceMs === undefined ? 0 : Math.max(0, advancedAt - playingSinceMs);
			audioTelemetry[uid] = {
				...state,
				...playback,
				listenedMs: playback.listenedMs + stillPlayingMs,
			};
		}

		const responseTelemetry: NonNullable<ScreenCompletionData["responseTelemetry"]> = {};
		for (const uid of Object.keys(responseStates)) {
			responseTelemetry[uid] = { ...responseRecordFor(responseTelemetryRef.current, uid) };
		}

		onComplete({
			screenUid,
			rowUid,
			advanceReason: pendingAdvanceRequestRef.current.reason,
			startedAt: startedAtRef.current,
			completedAt: advanceRequestedAtRef.current ?? performance.now(),
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
