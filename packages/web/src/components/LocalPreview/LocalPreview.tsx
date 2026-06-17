import { useState, useCallback } from "react";
import { Button, Typography } from "@leux/ui";
import { X } from "react-feather";
import styled from "@emotion/styled";
import type { IScreen } from "@/@types";
import { defaultCalibrationConfig } from "@/@types";
import { buildTrials, screensNeedEyeTracking } from "@/hooks/useExperiment";
import { useExperimentRunner } from "@/hooks/useExperimentRunner";
import { useWebGazer } from "@/hooks/useWebGazer";
import ExperimentTrialRenderer from "@/components/ExperimentTrialRenderer/ExperimentTrialRenderer";

interface LocalPreviewProps {
	screens: IScreen[];
	onClose: () => void;
}

const Overlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: ${({ theme }) => theme.main.backgroundOne};
	display: flex;
	flex-direction: column;
`;

const CloseBar = styled.div`
	position: absolute;
	top: 12px;
	right: 12px;
	z-index: 10;
`;

const Center = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	flex: 1;
	gap: 16px;
	text-align: center;
	padding: 24px;
`;

const LocalPreview: React.FC<LocalPreviewProps> = ({ screens, onClose }) => {
	const [started, setStarted] = useState(false);

	const needsEyeTracking = screensNeedEyeTracking(screens);
	const { trials: builtTrials, totalAudioTrials } = buildTrials(screens);
	const calibrationConfig = defaultCalibrationConfig;
	const webgazer = useWebGazer();

	const handleFinish = useCallback(() => {
		// Preview done — no data saved
	}, []);

	const runner = useExperimentRunner({
		trials: started ? builtTrials : [],
		onFinish: handleFinish,
	});

	const audioTrialCounter = runner.results.filter(
		(r) => r.type === "audio-rating" || r.type === "text-highlighting"
	).length;

	const handleStart = async () => {
		if (needsEyeTracking) {
			await webgazer.loadWebGazer();
		}
		setStarted(true);
	};

	// Finished
	if (started && runner.isFinished) {
		return (
			<Overlay>
				<CloseBar>
					<Button variant="ghost" onClick={onClose}><X size={18} /></Button>
				</CloseBar>
				<Center>
					<Typography variant="h3">Preview Complete</Typography>
					<Typography>This was a local preview. No data has been saved.</Typography>
					<Button colorScheme="primary" onClick={onClose}>Close Preview</Button>
				</Center>
			</Overlay>
		);
	}

	// Start screen
	if (!started) {
		return (
			<Overlay>
				<CloseBar>
					<Button variant="ghost" onClick={onClose}><X size={18} /></Button>
				</CloseBar>
				<Center>
					<Typography variant="h3">Screen Preview</Typography>
					<Typography>
						This will run through {builtTrials.length} trial{builtTrials.length !== 1 ? "s" : ""} built from your screens.
						{needsEyeTracking ? " Camera calibration will be included." : ""}
					</Typography>
					{builtTrials.length === 0 ? (
						<Typography textColor="placeholder">
							No trials could be generated. Screens may need media content assigned.
						</Typography>
					) : (
						<Button colorScheme="primary" onClick={handleStart}>
							Start Preview
						</Button>
					)}
				</Center>
			</Overlay>
		);
	}

	// Running
	return (
		<Overlay>
			<CloseBar>
				<Button variant="ghost" onClick={onClose}><X size={18} /></Button>
			</CloseBar>
			<ExperimentTrialRenderer
				currentTrial={runner.currentTrial}
				completeTrial={runner.completeTrial}
				calibrationConfig={calibrationConfig}
				webgazer={webgazer}
				totalAudioTrials={totalAudioTrials}
				audioTrialCounter={audioTrialCounter}
			/>
		</Overlay>
	);
};

export default LocalPreview;
