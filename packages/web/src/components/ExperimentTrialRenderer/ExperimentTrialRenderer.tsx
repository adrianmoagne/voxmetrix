import {
	AudioRatingTrial,
	CalibrationTrial,
	CameraInitTrial,
	FeedbackSurveyTrial,
	FixationCrossTrial,
	InstructionTrial,
	ScreenTrial,
	TextHighlightingTrial,
	ValidationTrial,
} from "@/components/trials";
import type { CalibrationConfig } from "@/@types";
import type { Trial, TrialResult } from "@/hooks/useExperimentRunner";
import type useWebGazer from "@/hooks/useWebGazer";

interface ExperimentTrialRendererProps {
	currentTrial: Trial | null;
	completeTrial: (response: any, extras?: Partial<TrialResult>) => void;
	calibrationConfig: CalibrationConfig;
	webgazer: ReturnType<typeof useWebGazer>;
	totalAudioTrials: number;
	audioTrialCounter: number;
}

const ExperimentTrialRenderer: React.FC<ExperimentTrialRendererProps> = ({
	currentTrial,
	completeTrial,
	calibrationConfig,
	webgazer,
	totalAudioTrials,
	audioTrialCounter,
}) => {
	if (!currentTrial) {
		return null;
	}

	return (
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
				<FixationCrossTrial duration={currentTrial.duration} onComplete={completeTrial} />
			)}
			{(currentTrial.type === "screen" || currentTrial.type === "form") &&
				currentTrial.screen && (
					<ScreenTrial
						screen={currentTrial.screen}
						onComplete={completeTrial}
						webgazer={webgazer}
						trackGaze={currentTrial.metadata.trackGaze}
						containerStyle={currentTrial.metadata.containerStyle}
					/>
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
	);
};

export default ExperimentTrialRenderer;
