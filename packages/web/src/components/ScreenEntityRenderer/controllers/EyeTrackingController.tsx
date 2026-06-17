import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEyeTrackingSession } from "@/components/StepRunner/EyeTrackingSessionContext";
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
	const {
		isTracking,
		startCapture,
		stopCapture,
	} = useEyeTrackingSession();
	const trackingRef = useRef(false);
	const startingRef = useRef(false);
	const [captureStartSettled, setCaptureStartSettled] = useState(true);

	const targetEntityUids = useMemo(
		() => (targets === "all-trackable" ? trackableEntityUids : targets.entityUids),
		[targets, trackableEntityUids]
	);

	const stopAndStoreCapture = useCallback(() => {
		if (!trackingRef.current) return;

		const gazeData = stopCapture();
		const targetBoundingBoxes = targetEntityUids
			.map((entityUid) => {
				const element = document.querySelector<HTMLElement>(`[data-entity-uid="${entityUid}"]`);
				if (!element) return null;

				const rect = element.getBoundingClientRect();
				return {
					entityUid,
					boundingBox: {
						left: rect.left,
						right: rect.right,
						top: rect.top,
						bottom: rect.bottom,
						width: rect.width,
						height: rect.height,
					},
				};
			})
			.filter(Boolean);

		trackingRef.current = false;
		setCompletionExtras({
			gazeData,
			targetBoundingBoxes,
		});
	}, [setCompletionExtras, stopCapture, targetEntityUids]);

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
					const gazeData = stopCapture();
					if (gazeData.length > 0) {
						setCompletionExtras({ gazeData });
					}
					return;
				}
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
			stopAndStoreCapture();
		}
	}, [audioStates, responseStates, stopAndStoreCapture, stopOn]);

	// Finalize screen completion only after tracking data has been captured.
	useEffect(() => {
		if (!pendingAdvanceRequest) return;
		if (!captureStartSettled || startingRef.current) return;

		if (trackingRef.current) {
			stopAndStoreCapture();
		}

		finalizeAdvance();
	}, [
		captureStartSettled,
		finalizeAdvance,
		pendingAdvanceRequest,
		stopAndStoreCapture,
	]);

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
		return () => {
			if (trackingRef.current) {
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
