import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEyeTrackingSession } from "@/components/StepRunner/EyeTrackingSessionContext";
import { GazeContextRecorder, measureTargetBoundingBoxes } from "@/utils/gazeContext";
import { useScreenRuntime } from "../ScreenRuntimeContext";

interface EyeTrackingControllerProps {
	startOn: "screen-enter" | "audio-start";
	stopOn: "audio-end" | "continue-click" | "responses-complete" | "screen-exit";
	targets: "all-trackable" | { entityUids: string[] };
	trackableEntityUids: string[];
	hideCursor?: boolean;
}

const EyeTrackingController: React.FC<EyeTrackingControllerProps> = ({
	startOn,
	stopOn,
	targets,
	trackableEntityUids,
	hideCursor = false,
}) => {
	const {
		audioStates,
		responseStates,
		fixationActive,
		pendingAdvanceRequest,
		setCompletionExtras,
		finalizeAdvance,
	} = useScreenRuntime();
	const { isTracking, calibrationIndex, startCapture, stopCapture, finishCapture } =
		useEyeTrackingSession();
	const trackingRef = useRef(false);
	const contextRecorderRef = useRef<GazeContextRecorder | null>(null);
	const calibrationIndexRef = useRef(calibrationIndex);
	calibrationIndexRef.current = calibrationIndex;
	const startingRef = useRef(false);
	const finishingRef = useRef<Promise<void> | null>(null);
	const finalizeAdvanceRef = useRef(finalizeAdvance);
	const mountedRef = useRef(true);
	const [captureStartSettled, setCaptureStartSettled] = useState(true);

	useEffect(() => {
		finalizeAdvanceRef.current = finalizeAdvance;
	}, [finalizeAdvance]);

	const targetEntityUids = useMemo(
		() => (targets === "all-trackable" ? trackableEntityUids : targets.entityUids),
		[targets, trackableEntityUids]
	);
	// Read at capture start without making the start effect depend on (and cancel over) it.
	const targetEntityUidsRef = useRef(targetEntityUids);
	targetEntityUidsRef.current = targetEntityUids;

	const stopAndStoreCapture = useCallback((): Promise<void> => {
		if (!trackingRef.current) return finishingRef.current ?? Promise.resolve();
		trackingRef.current = false;

		const targetBoundingBoxes = measureTargetBoundingBoxes(targetEntityUids);
		const contextRecorder = contextRecorderRef.current;
		contextRecorderRef.current = null;

		const finishing: Promise<void> = finishCapture()
			.then(({ samples: gazeData, capture: gazeCapture }) => {
				setCompletionExtras({
					gazeData,
					gazeCapture,
					targetBoundingBoxes,
					// Stopped after the drain, so it covers every frame that was analyzed.
					gazeContext: contextRecorder?.stop() ?? undefined,
				});
			})
			.catch(() => undefined)
			.finally(() => {
				contextRecorder?.stop();
				if (finishingRef.current === finishing) finishingRef.current = null;
			});
		finishingRef.current = finishing;
		return finishing;
	}, [finishCapture, setCompletionExtras, targetEntityUids]);

	// Start tracking
	useEffect(() => {
		if (trackingRef.current || startingRef.current || fixationActive) return;

		let shouldStart = false;

		if (startOn === "screen-enter") {
			shouldStart = true;
		}

		if (startOn === "audio-start") {
			shouldStart = Object.values(audioStates).some((state) => state.started);
		}

		if (!shouldStart) return;

		let cancelled = false;
		startingRef.current = true;
		setCaptureStartSettled(false);

		void startCapture()
			.then(() => {
				if (cancelled) {
					const { samples: gazeData, capture: gazeCapture } = stopCapture();
					if (gazeData.length > 0) {
						setCompletionExtras({ gazeData, gazeCapture });
					}
					return;
				}
				const contextRecorder = new GazeContextRecorder(
					targetEntityUidsRef.current,
					calibrationIndexRef.current
				);
				contextRecorder.start();
				contextRecorderRef.current = contextRecorder;
				trackingRef.current = true;
			})
			.catch(() => {
				trackingRef.current = false;
			})
			.finally(() => {
				startingRef.current = false;
				setCaptureStartSettled(true);
			});

		return () => {
			cancelled = true;
			startingRef.current = false;
			setCaptureStartSettled(true);
		};
	}, [audioStates, fixationActive, setCompletionExtras, startCapture, startOn, stopCapture]);

	// Stop tracking on behavior-driven conditions before screen completion
	useEffect(() => {
		if (!trackingRef.current) return;

		let shouldStop = false;

		if (stopOn === "audio-end") {
			shouldStop =
				Object.keys(audioStates).length > 0 &&
				Object.values(audioStates).every((state) => state.completed);
		} else if (stopOn === "responses-complete") {
			shouldStop =
				Object.keys(responseStates).length > 0 &&
				Object.values(responseStates).every((state) => state.completed);
		}

		if (shouldStop) {
			void stopAndStoreCapture();
		}
	}, [audioStates, responseStates, stopAndStoreCapture, stopOn]);

	// Finalize screen completion only after tracking data has been captured.
	useEffect(() => {
		if (!pendingAdvanceRequest) return;
		if (!captureStartSettled || startingRef.current) return;

		void stopAndStoreCapture().then(() => {
			if (mountedRef.current) finalizeAdvanceRef.current();
		});
	}, [captureStartSettled, pendingAdvanceRequest, stopAndStoreCapture]);

	// Cursor hiding
	useEffect(() => {
		if (!hideCursor || !isTracking) return;

		document.body.style.cursor = "none";
		return () => {
			document.body.style.cursor = "";
		};
	}, [hideCursor, isTracking]);

	// Cleanup on unmount
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			// Stopping resolves a pending drain; the advance waiting on it must not run.
			mountedRef.current = false;
			contextRecorderRef.current?.stop();
			contextRecorderRef.current = null;
			if (trackingRef.current || finishingRef.current) {
				stopCapture();
				trackingRef.current = false;
			}
			if (startingRef.current) {
				startingRef.current = false;
				document.body.style.cursor = "";
			}
		};
	}, [stopCapture]);

	return null;
};

export default EyeTrackingController;
