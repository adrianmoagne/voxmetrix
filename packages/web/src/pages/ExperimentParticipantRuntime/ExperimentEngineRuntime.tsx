import { useState, useCallback } from "react";
import { Button, Spinner, Typography } from "@leux/ui";
import type { ExperimentDefinition, ScreenCompletionData } from "@/@types/screen.model";
import {
	definitionNeedsEyeTracking,
	stepNeedsEyeTracking,
	useExperimentEngine,
	type ExperimentEngineReturn,
} from "@/hooks/useExperimentEngine";
import { StepRunner } from "@/components/StepRunner";
import CameraInitGate from "@/components/StepRunner/CameraInitGate";
import { ExperimentService } from "@/api/services";
import {
	isParticipantAssignmentEnabled,
	resolveAssignmentGroups,
} from "@/utils/participantAssignmentUtils";
import S from "./ExperimentParticipantRuntime.styles";
import {
	EyeTrackingSessionProvider,
	useOptionalEyeTrackingSession,
} from "@/components/StepRunner/EyeTrackingSessionContext";

interface ExperimentEngineRuntimeProps {
	experimentId: string;
	definition: ExperimentDefinition;
	isPreview?: boolean;
	onExit?: () => void;
}

interface ExperimentRunData {
	participantCondition?: string;
	definition?: ExperimentDefinition;
}

interface ExperimentRunResponse {
	participantCondition?: string;
	definition?: ExperimentDefinition;
	data?: ExperimentRunData;
}

interface ExperimentEngineExperimentViewProps {
	engine: ExperimentEngineReturn;
	cameraSetupComplete: boolean;
	onCameraSetupComplete: () => void;
	onCameraSetupReset: () => void;
}

interface ExperimentSessionProps {
	definition: ExperimentDefinition;
	participantCondition?: string;
	onFinish: (results: ScreenCompletionData[]) => void;
}

const ExperimentEngineExperimentView: React.FC<ExperimentEngineExperimentViewProps> = ({
	engine,
	cameraSetupComplete,
	onCameraSetupComplete,
	onCameraSetupReset,
}) => {
	const eyeTracking = useOptionalEyeTrackingSession();

	const handleTriggerRecalibration = () => {
		eyeTracking?.invalidateCalibration();
		onCameraSetupReset();
		engine.triggerRecalibration();
	};

	if (engine.needsRecalibration) {
		return (
			<S.Container>
				<div style={{ textAlign: "center", padding: 40 }}>
					<Typography variant="h3">Recalibration Needed</Typography>
					<Typography>
						The accuracy of the calibration is a little lower than we'd like.
					</Typography>
					<Typography>
						Let's try again — first reposition your face, then recalibrate.
					</Typography>
					<div style={{ marginTop: 24 }}>
						<Button colorScheme="primary" onClick={handleTriggerRecalibration}>
							Recalibrate
						</Button>
					</div>
				</div>
			</S.Container>
		);
	}

	if (!engine.currentStep) return null;

	const currentStepNeedsEyeTracking = stepNeedsEyeTracking(engine.currentStep.step);
	const showCameraGate = currentStepNeedsEyeTracking && !cameraSetupComplete;

	if (showCameraGate) {
		return <CameraInitGate onComplete={onCameraSetupComplete} />;
	}

	return (
		<S.ExperimentStepContainer>
			<StepRunner
				key={engine.currentIndex}
				executionStep={engine.currentStep}
				onComplete={engine.completeStep}
				audioProgress={engine.audioProgress}
			/>
		</S.ExperimentStepContainer>
	);
};

const ExperimentSession: React.FC<ExperimentSessionProps> = ({
	definition,
	participantCondition,
	onFinish,
}) => {
	const [cameraSetupComplete, setCameraSetupComplete] = useState(false);
	const engine = useExperimentEngine({
		definition,
		participantCondition,
		onFinish,
	});

	const experimentNeedsEyeTracking = definitionNeedsEyeTracking(definition);

	const experimentContent = (
		<ExperimentEngineExperimentView
			engine={engine}
			cameraSetupComplete={cameraSetupComplete}
			onCameraSetupComplete={() => setCameraSetupComplete(true)}
			onCameraSetupReset={() => setCameraSetupComplete(false)}
		/>
	);

	return experimentNeedsEyeTracking ? (
		<EyeTrackingSessionProvider>{experimentContent}</EyeTrackingSessionProvider>
	) : (
		experimentContent
	);
};

const ExperimentEngineRuntime: React.FC<ExperimentEngineRuntimeProps> = ({
	experimentId,
	definition,
	isPreview = false,
	onExit,
}) => {
	type Step = "welcome" | "form" | "experiment" | "completed";

	const assignmentEnabled = isParticipantAssignmentEnabled(definition);
	const assignmentGroups = resolveAssignmentGroups(definition);

	const [step, setStep] = useState<Step>("welcome");
	const [participant, setParticipant] = useState({ name: "", email: "" });
	const [previewCondition, setPreviewCondition] = useState(assignmentGroups[0] ?? "");
	const [participantCondition, setParticipantCondition] = useState<string | undefined>();
	const [sessionStarted, setSessionStarted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isStarting, setIsStarting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [previewResults, setPreviewResults] = useState<ScreenCompletionData[]>([]);

	const handleFinish = useCallback(
		async (results: ScreenCompletionData[]) => {
			if (isPreview) {
				setPreviewResults(results);
				setStep("completed");
				return;
			}

			setIsSubmitting(true);
			try {
				await ExperimentService.submitResult(experimentId, {
					experiment_id: experimentId,
					participant,
					participantCondition,
					timestamp: new Date().toISOString(),
					browser_info: {
						userAgent: navigator.userAgent,
						windowWidth: window.innerWidth,
						windowHeight: window.innerHeight,
					},
					schema_version: 2,
					steps: results,
				});
				setStep("completed");
			} catch {
				setError("Failed to submit results. Please contact the researcher.");
			} finally {
				setIsSubmitting(false);
			}
		},
		[experimentId, participant, participantCondition, isPreview]
	);

	const startExperiment = useCallback(async () => {
		setError(null);

		if (!assignmentEnabled) {
			setParticipantCondition(undefined);
			setSessionStarted(true);
			setStep("experiment");
			return;
		}

		if (isPreview) {
			const condition = previewCondition.trim() || assignmentGroups[0];
			if (!condition) {
				setError("Select a preview condition before starting.");
				return;
			}
			setParticipantCondition(condition);
			setSessionStarted(true);
			setStep("experiment");
			return;
		}

		setIsStarting(true);
		try {
			const urlParams = new URLSearchParams(window.location.search);
			const urlCondition = urlParams.get("condition") ?? undefined;
			const response = await ExperimentService.fetchExperimentForParticipant<ExperimentRunResponse>(
				experimentId,
				{
					email: participant.email,
					condition: urlCondition,
				}
			);
			const runData = response.data.data ?? response.data;
			const resolvedCondition = runData.participantCondition;

			if (!resolvedCondition) {
				setError(
					"Could not assign a participant condition. Check the experiment link and try again."
				);
				return;
			}

			setParticipantCondition(resolvedCondition);
			setSessionStarted(true);
			setStep("experiment");
		} catch (err) {
			const message =
				typeof err === "object" &&
				err !== null &&
				"response" in err &&
				typeof (err as { response?: { data?: { message?: string } } }).response?.data
					?.message === "string"
					? (err as { response: { data: { message: string } } }).response.data.message
					: "Failed to start experiment. Please contact the researcher.";
			setError(message);
		} finally {
			setIsStarting(false);
		}
	}, [
		assignmentEnabled,
		assignmentGroups,
		experimentId,
		isPreview,
		participant.email,
		previewCondition,
	]);

	const handleWelcomeContinue = () => {
		if (isPreview) {
			void startExperiment();
			return;
		}
		setStep("form");
	};

	const canProceedFromForm =
		participant.name.trim().length > 0 && participant.email.trim().length > 0;
	const canProceedFromWelcome =
		!isPreview ||
		!assignmentEnabled ||
		previewCondition.trim().length > 0 ||
		assignmentGroups.length === 0;

	if (error) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Typography variant="h3" textColor="danger">Error</Typography>
					<Typography>{error}</Typography>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	if (step === "welcome") {
		return (
			<S.Container>
				<S.WelcomeContainer>
					<Typography variant="h2">Welcome to the Experiment</Typography>
					<Typography>
						Thank you for participating in this study. Please click Next to continue.
					</Typography>
					{isPreview && assignmentEnabled && assignmentGroups.length > 0 && (
						<S.FormField style={{ marginTop: 24, width: "100%", maxWidth: 360 }}>
							<Typography>Preview condition</Typography>
							<select
								style={{
									width: "100%",
									padding: "8px",
									borderRadius: "4px",
									border: "1px solid #ccc",
								}}
								value={previewCondition}
								onChange={(e) => setPreviewCondition(e.target.value)}
							>
								{assignmentGroups.map((group) => (
									<option key={group} value={group}>
										{group}
									</option>
								))}
							</select>
						</S.FormField>
					)}
					<S.ButtonGroup>
						<Button
							colorScheme="primary"
							onClick={handleWelcomeContinue}
							state={{ disabled: !canProceedFromWelcome }}
						>
							Next
						</Button>
					</S.ButtonGroup>
				</S.WelcomeContainer>
			</S.Container>
		);
	}

	if (step === "form") {
		return (
			<S.Container>
				<S.FormContainer>
					<h3 style={{ marginBottom: "24px", textAlign: "center" }}>Participant Information</h3>
					<S.FormField>
						<Typography>Full Name</Typography>
						<input
							style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
							onChange={(e) => setParticipant((p) => ({ ...p, name: e.target.value }))}
						/>
					</S.FormField>
					<S.FormField>
						<Typography>Email Address</Typography>
						<input
							type="email"
							style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
							onChange={(e) => setParticipant((p) => ({ ...p, email: e.target.value }))}
						/>
					</S.FormField>
					<S.ButtonGroup>
						<Button colorScheme="secondary" onClick={() => setStep("welcome")}>
							Back
						</Button>
						<Button
							colorScheme="primary"
							onClick={() => void startExperiment()}
							state={{ disabled: !canProceedFromForm || isStarting }}
						>
							{isStarting ? "Starting..." : "Start Experiment"}
						</Button>
					</S.ButtonGroup>
				</S.FormContainer>
			</S.Container>
		);
	}

	if (step === "completed") {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Typography variant="h2">
						{isPreview ? "Preview Complete" : "Thank You!"}
					</Typography>
					<Typography>
						{isPreview
							? "This was a preview run. No data has been saved."
							: "The experiment is now complete. Your responses have been recorded."}
					</Typography>
					{assignmentEnabled && participantCondition && (
						<Typography variant="caption">Condition: {participantCondition}</Typography>
					)}
					{isPreview && previewResults.length > 0 && (
						<pre
							style={{
								marginTop: 16,
								padding: 16,
								background: "#1e1e1e",
								color: "#d4d4d4",
								borderRadius: 8,
								fontSize: 12,
								maxHeight: "60vh",
								overflow: "auto",
								textAlign: "left",
								width: "100%",
								maxWidth: 800,
							}}
						>
							{JSON.stringify(previewResults, null, 2)}
						</pre>
					)}
					{onExit ? (
						<Button colorScheme="primary" onClick={onExit}>
							Back to Editor
						</Button>
					) : (
						<Typography variant="caption">You may now close this window.</Typography>
					)}
				</S.CompletionContainer>
			</S.Container>
		);
	}

	if (isSubmitting || isStarting) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Spinner size="large" />
					<Typography variant="body-1">
						{isSubmitting
							? "Submitting your responses. Please do not close this window..."
							: "Preparing your session..."}
					</Typography>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	if (!sessionStarted) {
		return null;
	}

	return (
		<ExperimentSession
			key={participantCondition ?? "default"}
			definition={definition}
			participantCondition={participantCondition}
			onFinish={handleFinish}
		/>
	);
};

export default ExperimentEngineRuntime;
