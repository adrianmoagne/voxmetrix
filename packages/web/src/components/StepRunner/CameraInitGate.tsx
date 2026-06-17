import { useEffect, useRef } from "react";
import { Button, Spinner, Typography } from "@leux/ui";
import { useFacePositionReady } from "@/hooks/useFacePositionReady";
import {
	applyWebGazerPreviewLayout,
	getVideoContainer,
	mountWebGazerPreview,
	releaseWebGazerPreview,
} from "@/utils/webgazerPreview";
import { useEyeTrackingSession } from "./EyeTrackingSessionContext";
import S from "./steps/CameraInitStepRenderer.styles";

interface CameraInitGateProps {
	onComplete: () => void;
}

const CameraInitGate: React.FC<CameraInitGateProps> = ({ onComplete }) => {
	const eyeTracking = useEyeTrackingSession();
	const previewRef = useRef<HTMLDivElement>(null);
	const faceReady = useFacePositionReady({ enabled: eyeTracking.isReady });

	const handleComplete = () => {
		eyeTracking.hidePreview();
		releaseWebGazerPreview();
		onComplete();
	};

	useEffect(() => {
		void eyeTracking.ensureReady().catch(() => undefined);
	}, [eyeTracking.ensureReady]);

	useEffect(() => {
		if (!eyeTracking.isReady) return;

		const container = previewRef.current;
		if (!container) return;

		const applyLayout = () => {
			const width = container.clientWidth;
			if (width < 100) return;

			const height = Math.round((width * 3) / 4);
			const layout = { width, height };

			if (!getVideoContainer()?.parentElement?.closest("[data-webgazer-preview-root]")) {
				mountWebGazerPreview(container, layout);
			} else {
				applyWebGazerPreviewLayout(layout);
			}

			eyeTracking.showPositioningPreview(layout);
		};

		const resizeObserver = new ResizeObserver(applyLayout);
		resizeObserver.observe(container);
		requestAnimationFrame(applyLayout);

		return () => {
			resizeObserver.disconnect();
			eyeTracking.hidePreview();
			releaseWebGazerPreview();
		};
	}, [eyeTracking.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

	if (eyeTracking.error) {
		return (
			<S.LoadingState>
				<Typography variant="h3" textColor="danger">
					Eye Tracking Error
				</Typography>
				<Typography>{eyeTracking.error}</Typography>
			</S.LoadingState>
		);
	}

	if (!eyeTracking.isReady) {
		return (
			<S.LoadingState>
				<Spinner size="large" />
				<Typography>Preparing camera...</Typography>
			</S.LoadingState>
		);
	}

	return (
		<S.Layout>
			<S.PreviewMount ref={previewRef} aria-label="Webcam preview" />
			<S.InstructionCard>
				<S.InstructionText>
					Place your face in the centre of the box, until the surround turns solid blue.
				</S.InstructionText>
				<Button colorScheme="primary" state={{ disabled: !faceReady }} onClick={handleComplete}>
					Next
				</Button>
			</S.InstructionCard>
		</S.Layout>
	);
};

export default CameraInitGate;
