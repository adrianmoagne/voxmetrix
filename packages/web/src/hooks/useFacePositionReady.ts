import { useEffect, useState } from "react";
import { isFaceInValidationBox } from "@/utils/webgazerPreview";

interface UseFacePositionReadyOptions {
	enabled: boolean;
	stableMs?: number;
	pollMs?: number;
}

export function useFacePositionReady({
	enabled,
	stableMs = 600,
	pollMs = 100,
}: UseFacePositionReadyOptions): boolean {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (!enabled) {
			setIsReady(false);
			return;
		}

		let consecutive = 0;
		const requiredSamples = Math.max(1, Math.ceil(stableMs / pollMs));

		const intervalId = window.setInterval(() => {
			if (isFaceInValidationBox()) {
				consecutive += 1;
				if (consecutive >= requiredSamples) {
					setIsReady(true);
				}
			} else {
				consecutive = 0;
				setIsReady(false);
			}
		}, pollMs);

		return () => {
			window.clearInterval(intervalId);
			setIsReady(false);
		};
	}, [enabled, pollMs, stableMs]);

	return isReady;
}
