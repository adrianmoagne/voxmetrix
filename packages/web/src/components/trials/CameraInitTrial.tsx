import { useEffect, useState } from "react";
import { Button, Typography } from "@leux/ui";
import type { UseWebGazerReturn } from "@/hooks/useWebGazer";

interface CameraInitTrialProps {
	webgazer: UseWebGazerReturn;
	onComplete: (response: null) => void;
}

const CameraInitTrial: React.FC<CameraInitTrialProps> = ({ webgazer, onComplete }) => {
	const [isInitializing, setIsInitializing] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const init = async () => {
			try {
				await webgazer.initCamera();
				setIsInitializing(false);
			} catch (err) {
				console.error("Camera init failed:", err);
				setError("Failed to initialize camera. Please check your webcam permissions.");
				setIsInitializing(false);
			}
		};
		init();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	if (error) {
		return (
			<div style={{ textAlign: "center", padding: 40 }}>
				<Typography variant="h3" textColor="danger">
					Camera Error
				</Typography>
				<Typography>{error}</Typography>
			</div>
		);
	}

	if (isInitializing) {
		return (
			<div style={{ textAlign: "center", padding: 40 }}>
				<Typography>Initializing camera...</Typography>
			</div>
		);
	}

	return (
		<div style={{ textAlign: "center", padding: 40 }}>
			<Typography variant="h3">Camera Setup</Typography>
			<p>Position your head so that your face is centered in the box and green.</p>
			<div style={{ marginTop: 24 }}>
				<Button colorScheme="primary" onClick={() => onComplete(null)}>
					Continue
				</Button>
			</div>
		</div>
	);
};

export default CameraInitTrial;
