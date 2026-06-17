import { useEffect, useRef } from "react";
import { useScreenRuntime } from "../ScreenRuntimeContext";
import type { AdvanceReason } from "@/@types/screen.model";

interface AdvanceRuleControllerProps {
	when: AdvanceReason;
	timeoutMs?: number;
}

const AdvanceRuleController: React.FC<AdvanceRuleControllerProps> = ({ when, timeoutMs }) => {
	const { phase, audioStates, responseStates, requestAdvance } = useScreenRuntime();
	const firedRef = useRef(false);

	useEffect(() => {
		if (firedRef.current) return;

		let shouldAdvance = false;

		switch (when) {
			case "audio-ended": {
				const allDone = Object.values(audioStates).every((s) => s.completed);
				if (allDone && Object.keys(audioStates).length > 0) shouldAdvance = true;
				break;
			}
			case "responses-complete": {
				const allDone = Object.values(responseStates).every((s) => s.completed);
				if (allDone && Object.keys(responseStates).length > 0) shouldAdvance = true;
				break;
			}
			case "continue-click":
				// Handled by ContinueButtonEntity directly
				break;
			case "timeout":
				// Handled by the timeout effect below
				break;
		}

		if (shouldAdvance) {
			firedRef.current = true;
			requestAdvance({ reason: when, at: performance.now() });
		}
	}, [when, phase, audioStates, responseStates, requestAdvance]);

	// Timeout handler
	useEffect(() => {
		if (when !== "timeout" || !timeoutMs || firedRef.current) return;

		const timer = setTimeout(() => {
			if (firedRef.current) return;
			firedRef.current = true;
			requestAdvance({ reason: "timeout", at: performance.now() });
		}, timeoutMs);

		return () => clearTimeout(timer);
	}, [when, timeoutMs, requestAdvance]);

	return null;
};

export default AdvanceRuleController;
