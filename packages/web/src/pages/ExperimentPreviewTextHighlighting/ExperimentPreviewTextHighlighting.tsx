import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button, Typography } from "@leux/ui";
import { useExperiment } from "@/hooks";
import { Pages } from "@/@types";
import {
	AudioRatingTrial,
	FeedbackSurveyTrial,
	InstructionTrial,
	ScreenTrial,
	TextHighlightingTrial,
} from "@/components/trials";
import S from "./ExperimentPreviewTextHighlighting.styles";

const ExperimentPreviewTextHighlighting = () => {
	const params = useParams();
	const navigate = useNavigate();
	const experimentId = params.id as string;

	const {
		currentTrial,
		completeTrial,
		isLoading,
		isFinished,
		error,
		startExperiment,
		totalAudioTrials,
		audioTrialCounter,
	} = useExperiment({
		experimentId,
		experimentType: "textHighlighting",
		isPreview: true,
		onFinish: () => {
			// Preview completed - data not saved
		},
	});

	// Auto-start on mount
	useEffect(() => {
		startExperiment();
	}, [startExperiment]);

	const handleBackToExperiment = () => {
		navigate(Pages.Experiment.replace(":id", experimentId));
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

	return (
		<S.Container>
			{isLoading && (
				<div style={{ textAlign: "center", padding: "40px" }}>
					<Typography>Loading experiment...</Typography>
				</div>
			)}
			{!isLoading && currentTrial && (
				<>
					{currentTrial.type === "screen" && currentTrial.screen && (
						<ScreenTrial screen={currentTrial.screen} onComplete={completeTrial} />
					)}
					{currentTrial.type === "form" && currentTrial.screen && (
						<ScreenTrial screen={currentTrial.screen} onComplete={completeTrial} />
					)}
					{currentTrial.type === "audio-rating" && currentTrial.audioSource && (
						<AudioRatingTrial
							audioSource={currentTrial.audioSource}
							prompt={currentTrial.metadata.prompt}
							scale={currentTrial.metadata.scale}
							audioTrialIndex={audioTrialCounter + 1}
							totalAudioTrials={totalAudioTrials}
							onComplete={completeTrial}
						/>
					)}
					{currentTrial.type === "text-highlighting" && currentTrial.audioSource && (
						<TextHighlightingTrial
							audioSource={currentTrial.audioSource}
							fullText={currentTrial.metadata.fullText}
							audioTrialIndex={audioTrialCounter + 1}
							totalAudioTrials={totalAudioTrials}
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

export default ExperimentPreviewTextHighlighting;
