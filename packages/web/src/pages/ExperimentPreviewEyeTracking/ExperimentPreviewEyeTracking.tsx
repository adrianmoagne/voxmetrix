import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Button, Typography } from "@leux/ui";
import { useExperiment } from "@/hooks";
import { Pages } from "@/@types";
import {
	AudioRatingTrial,
	CalibrationTrial,
	CameraInitTrial,
	FeedbackSurveyTrial,
	FixationCrossTrial,
	InstructionTrial,
	ScreenTrial,
	ValidationTrial,
} from "@/components/trials";
import S from "./ExperimentPreviewEyeTracking.styles";

const ExperimentPreviewEyeTracking = () => {
	const params = useParams();
	const navigate = useNavigate();
	const experimentId = params.id as string;
	const [hasStarted, setHasStarted] = useState(false);

	const handleFinish = useCallback((_results: any) => {
		// Preview completed - data not saved
	}, []);

	const {
		currentTrial,
		completeTrial,
		isLoading,
		isFinished,
		error,
		startExperiment,
		webgazer,
		calibrationConfig,
		needsRecalibration,
		triggerRecalibration,
	} = useExperiment({
		experimentId,
		experimentType: "eyetrackingMos",
		isPreview: true,
		skipParticipantForm: true,
		onFinish: handleFinish,
	});

	const handleBackToExperiment = () => {
		navigate(Pages.Experiment.replace(":id", experimentId));
	};

	const handleStartPreview = () => {
		setHasStarted(true);
		startExperiment();
	};

	if (error) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Typography variant="h3" textColor="danger">
						Error
					</Typography>
					<Typography>{error}</Typography>
					<Button colorScheme="primary" onClick={handleBackToExperiment}>
						Go back to experiment
					</Button>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	if (isFinished) {
		return (
			<S.Container>
				{/* <S.PreviewBanner>
					<AlertTriangle size={16} />
					Preview Mode - Data was not saved
				</S.PreviewBanner> */}
				<S.CompletionContainer>
					<Typography variant="h3">Preview Complete</Typography>
					<Typography>
						This was a preview run. No data has been saved.
					</Typography>
					<Button colorScheme="primary" onClick={handleBackToExperiment}>
						Return to Experiment
					</Button>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	// Handle recalibration
	if (needsRecalibration) {
		return (
			<S.Container>
				{/* <S.PreviewBanner>
					<AlertTriangle size={16} />
					Preview Mode - Data will not be saved
				</S.PreviewBanner> */}
				<div style={{ textAlign: "center", padding: 40 }}>
					<Typography variant="h3">Recalibration Needed</Typography>
					<Typography>
						The accuracy of the calibration is a little lower than we'd like.
					</Typography>
					<div style={{ marginTop: 24 }}>
						<Button colorScheme="primary" onClick={triggerRecalibration}>
							Recalibrate
						</Button>
					</div>
				</div>
			</S.Container>
		);
	}

	return (
		<S.Container>
			{/* <S.PreviewBanner>
				<AlertTriangle size={16} />
				Preview Mode - Data will not be saved
			</S.PreviewBanner> */}

			{/* Show start button overlay before experiment starts */}
			{!hasStarted && (
				<S.CompletionContainer>
					<Typography variant="h3">Eye Tracking Preview</Typography>
					<Typography>
						This will run through the full experiment including camera calibration.
					</Typography>
					<Typography variant="caption">
						Make sure your webcam is available and you're in a well-lit environment.
					</Typography>
					<Button colorScheme="primary" onClick={handleStartPreview}>
						Start Preview
					</Button>
				</S.CompletionContainer>
			)}

			{/* Show loading state after clicking start */}
			{hasStarted && isLoading && (
				<div
					style={{
						textAlign: "center",
						padding: "40px",
					}}
				>
					<Typography>Loading experiment...</Typography>
				</div>
			)}

			{/* Render current trial */}
			{hasStarted && !isLoading && currentTrial && (
				<>
					{currentTrial.type === "camera-init" && (
						<CameraInitTrial webgazer={webgazer} onComplete={completeTrial} />
					)}
					{currentTrial.type === "calibration" && (
						<CalibrationTrial
							calibrationPoints={calibrationConfig.calibrationPoints}
							predictionsPerPoint={10}
							predictionInterval={200}
							timeToSaccade={calibrationConfig.timeToSaccade}
							randomizeOrder={calibrationConfig.randomizeCalibrationOrder}
							repetitionsPerPoint={calibrationConfig.repetitionsPerPoint}
							webgazer={webgazer}
							onComplete={completeTrial}
						/>
					)}
					{currentTrial.type === "validation" && (
						<ValidationTrial
							validationPoints={calibrationConfig.validationPoints}
							predictionsPerPoint={10}
							predictionInterval={200}
							timeToSaccade={calibrationConfig.timeToSaccade}
							roiRadius={calibrationConfig.roiRadius}
							webgazer={webgazer}
							onComplete={completeTrial}
						/>
					)}
					{currentTrial.type === "fixation" && (
						<FixationCrossTrial
							duration={currentTrial.duration}
							onComplete={completeTrial}
						/>
					)}
					{currentTrial.type === "screen" && currentTrial.screen && (
						<ScreenTrial
							screen={currentTrial.screen}
							onComplete={completeTrial}
							webgazer={webgazer}
							trackGaze={currentTrial.metadata.trackGaze}
							containerStyle={currentTrial.metadata.containerStyle}
						/>
					)}
					{currentTrial.type === "form" && currentTrial.screen && (
						<ScreenTrial screen={currentTrial.screen} onComplete={completeTrial} />
					)}
					{currentTrial.type === "audio-rating" && currentTrial.audioSource && (
						<AudioRatingTrial
							audioSource={currentTrial.audioSource}
							prompt={currentTrial.metadata.prompt}
							scale={currentTrial.metadata.scale}
							audioTrialIndex={currentTrial.metadata.audioTrialIndex}
							totalAudioTrials={currentTrial.metadata.totalAudioTrials}
							onComplete={completeTrial}
						/>
					)}
					{currentTrial.type === "instruction" && (
						<InstructionTrial
							content={currentTrial.metadata.content}
							buttonText={currentTrial.metadata.buttonText}
							onComplete={completeTrial}
						/>
					)}
					{currentTrial.type === "feedback" && (
						<FeedbackSurveyTrial
							questions={currentTrial.metadata.questions}
							onComplete={completeTrial}
						/>
					)}
				</>
			)}
		</S.Container>
	);
};

export default ExperimentPreviewEyeTracking;
