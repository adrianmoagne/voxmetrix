import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button, Spinner, Typography } from "@leux/ui";
import { useExperiment } from "@/hooks";
import { ExperimentTrialRenderer } from "@/components";
import { ExperimentService } from "@/api/services";
import { Pages, type ExperimentType, type IScreen } from "@/@types";
import { screensNeedEyeTracking } from "@/hooks/useExperiment";
import S from "./ExperimentPreview.styles";

const ExperimentPreview = () => {
	const params = useParams();
	const navigate = useNavigate();
	const experimentId = params.id as string;
	const [hasStarted, setHasStarted] = useState(false);
	const [needsEyeTracking, setNeedsEyeTracking] = useState(false);
	const [detectedType, setDetectedType] = useState<ExperimentType | undefined>(undefined);
	const [isDetecting, setIsDetecting] = useState(true);

	// Pre-fetch experiment to detect if eye tracking is needed
	useEffect(() => {
		ExperimentService.fetchExperimentById(experimentId)
			.then((res) => {
				const experimentData = res.data?.data;
				if (experimentData?.screens) {
					const screens = experimentData.screens as IScreen[];
					setNeedsEyeTracking(screensNeedEyeTracking(screens));
				}
				// Use legacy type if present
				if (experimentData?.type) {
					setDetectedType(experimentData.type);
					if (experimentData.type === "eyetrackingMos") {
						setNeedsEyeTracking(true);
					}
				}
				setIsDetecting(false);
			})
			.catch(() => {
				setIsDetecting(false);
			});
	}, [experimentId]);

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
		totalAudioTrials,
		audioTrialCounter,
		needsRecalibration,
		triggerRecalibration,
	} = useExperiment({
		experimentId,
		experimentType: detectedType,
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

	if (isDetecting) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Spinner size="large" />
					<Typography variant="body-1">Detecting experiment configuration...</Typography>
				</S.CompletionContainer>
			</S.Container>
		);
	}

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

	if (needsRecalibration) {
		return (
			<S.Container>
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

	// Start screen - show webcam notice for eye tracking
	if (!hasStarted) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Typography variant="h3">Experiment Preview</Typography>
					<Typography>
						This will run through the full experiment
						{needsEyeTracking ? " including camera calibration" : ""}.
					</Typography>
					{needsEyeTracking && (
						<Typography variant="caption">
							Make sure your webcam is available and you're in a well-lit environment.
						</Typography>
					)}
					<Button colorScheme="primary" onClick={handleStartPreview}>
						Start Preview
					</Button>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	// Loading state
	if (isLoading) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Spinner size="large" />
					<Typography variant="body-1">Loading experiment...</Typography>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	// Render current trial
	return (
		<S.Container>
			<ExperimentTrialRenderer
				currentTrial={currentTrial}
				completeTrial={completeTrial}
				calibrationConfig={calibrationConfig}
				webgazer={webgazer}
				totalAudioTrials={totalAudioTrials}
				audioTrialCounter={audioTrialCounter}
			/>
		</S.Container>
	);
};

export default ExperimentPreview;
