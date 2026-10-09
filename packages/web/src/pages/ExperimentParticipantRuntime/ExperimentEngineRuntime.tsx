import { useState, useCallback, useEffect, useRef } from "react";
import { isAxiosError } from "axios";
import { Button, Spinner, Typography } from "@leux/ui";
import type { ExperimentDefinition, ScreenCompletionData } from "@/@types/screen.model";
import {
	buildExecutionQueue,
	definitionNeedsEyeTracking,
	stepNeedsEyeTracking,
	useExperimentEngine,
	withResumeRecalibration,
	type ExecutionStep,
	type ExperimentEngineReturn,
} from "@/hooks/useExperimentEngine";
import { StepRunner } from "@/components/StepRunner";
import CameraInitGate from "@/components/StepRunner/CameraInitGate";
import { ExperimentService } from "@/api/services";
import {
	SessionService,
	currentBrowserInfo,
	type SessionRef,
	type SessionState,
} from "@/api/services/SessionService";
import {
	ResultSessionRecorder,
	clearSessionPointer,
	readSessionPointer,
	writeSessionPointer,
} from "@/utils/resultSessionRecorder";
import { createSeededRandom, randomSeed } from "@/utils/seededRandom";
import { isSupportedEyeTrackingBrowser } from "@/utils/browserSupport";
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
	runPlan: RunPlan | null;
	onStepComplete: (data: ScreenCompletionData) => void;
	onFinish: (results: ScreenCompletionData[]) => void;
}

/** Steps of a participant session and where to start (after the saved ones when resuming). */
interface RunPlan {
	queue: ExecutionStep[];
	startIndex: number;
}

interface ResumeInfo {
	session: SessionRef;
	state: SessionState;
}

/** How long the final screen waits for the last responses to reach the server. */
const SAVE_TIMEOUT_MS = 60_000;

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
	runPlan,
	onStepComplete,
	onFinish,
}) => {
	const [cameraSetupComplete, setCameraSetupComplete] = useState(false);
	const engine = useExperimentEngine({
		definition,
		participantCondition,
		initialQueue: runPlan?.queue,
		startIndex: runPlan?.startIndex,
		onStepComplete,
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
	type Step = "loading" | "resume" | "welcome" | "form" | "experiment" | "saving" | "completed";

	const assignmentEnabled = isParticipantAssignmentEnabled(definition);
	const assignmentGroups = resolveAssignmentGroups(definition);
	const experimentNeedsEyeTracking = definitionNeedsEyeTracking(definition);
	const unsupportedBrowser =
		!isPreview && experimentNeedsEyeTracking && !isSupportedEyeTrackingBrowser();

	const [step, setStep] = useState<Step>(isPreview ? "welcome" : "loading");
	const [linkCopied, setLinkCopied] = useState(false);
	const [participant, setParticipant] = useState({ name: "", email: "" });
	const [previewCondition, setPreviewCondition] = useState(assignmentGroups[0] ?? "");
	const [participantCondition, setParticipantCondition] = useState<string | undefined>();
	const [sessionStarted, setSessionStarted] = useState(false);
	const [runPlan, setRunPlan] = useState<RunPlan | null>(null);
	const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
	const [isStarting, setIsStarting] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [previewResults, setPreviewResults] = useState<ScreenCompletionData[]>([]);

	const recorderRef = useRef<ResultSessionRecorder | null>(null);
	/** Index in the result's `steps` the next completed step is saved at. */
	const nextSeqRef = useRef(0);
	/** Plan index of the step interrupted before a resume; flagged when it completes again. */
	const interruptedPlanIndexRef = useRef<number | null>(null);

	// A session this browser left unfinished is offered for resuming.
	useEffect(() => {
		if (isPreview) return;
		const session = readSessionPointer(experimentId);
		if (!session) {
			setStep("welcome");
			return;
		}

		let cancelled = false;
		SessionService.getSession(session)
			.then((response) => {
				if (cancelled) return;
				const state = response.data.data;
				if (state.status === "in_progress") {
					setResumeInfo({ session, state });
					setStep("resume");
					return;
				}
				clearSessionPointer(experimentId);
				setStep("welcome");
			})
			.catch((err) => {
				if (cancelled) return;
				if (isAxiosError(err) && err.response?.status === 404) {
					clearSessionPointer(experimentId);
					setStep("welcome");
					return;
				}
				setError("Could not connect to the server. Check your internet connection and reload the page.");
			});

		return () => {
			cancelled = true;
		};
	}, [experimentId, isPreview]);

	// Leaving mid-session would interrupt it; the browser asks the participant to confirm.
	useEffect(() => {
		if (isPreview || (step !== "experiment" && step !== "saving")) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [isPreview, step]);

	const finishSession = useCallback(async () => {
		const recorder = recorderRef.current;
		if (!recorder) return;

		setStep("saving");
		setSaveError(null);
		try {
			await recorder.complete(nextSeqRef.current, SAVE_TIMEOUT_MS);
			clearSessionPointer(experimentId);
			setStep("completed");
		} catch {
			setSaveError("Some of your responses have not reached the server yet.");
		}
	}, [experimentId]);

	const handleStepComplete = useCallback((data: ScreenCompletionData) => {
		const recorder = recorderRef.current;
		if (!recorder) return;

		const resumed =
			data.planIndex !== undefined && data.planIndex === interruptedPlanIndexRef.current;
		if (resumed) interruptedPlanIndexRef.current = null;

		recorder.save(nextSeqRef.current++, {
			...data,
			timeOrigin: performance.timeOrigin,
			...(resumed ? { resumedAfterInterruption: true } : {}),
		});
	}, []);

	const handleFinish = useCallback(
		(results: ScreenCompletionData[]) => {
			if (isPreview) {
				setPreviewResults(results);
				setStep("completed");
				return;
			}
			void finishSession();
		},
		[finishSession, isPreview]
	);

	const downloadResponses = () => {
		const recorder = recorderRef.current;
		if (!recorder) return;
		const blob = new Blob(
			[
				JSON.stringify(
					{
						experimentId,
						resultId: recorder.session.resultId,
						participant,
						participantCondition,
						steps: recorder.allSteps(),
					},
					null,
					2
				),
			],
			{ type: "application/json" }
		);
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `responses_${recorder.session.resultId}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const resolveCondition = async (): Promise<string | undefined> => {
		const urlCondition = new URLSearchParams(window.location.search).get("condition") ?? undefined;
		const response = await ExperimentService.fetchExperimentForParticipant<ExperimentRunResponse>(
			experimentId,
			{ email: participant.email, condition: urlCondition }
		);
		const runData = response.data.data ?? response.data;
		return runData.participantCondition;
	};

	const startExperiment = async () => {
		setError(null);

		if (isPreview) {
			const condition = assignmentEnabled
				? previewCondition.trim() || assignmentGroups[0]
				: undefined;
			if (assignmentEnabled && !condition) {
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
			const condition = assignmentEnabled ? await resolveCondition() : undefined;
			if (assignmentEnabled && !condition) {
				setError(
					"Could not assign a participant condition. Check the experiment link and try again."
				);
				return;
			}

			const seed = randomSeed();
			const queue = buildExecutionQueue(definition, {
				participantCondition: condition,
				random: createSeededRandom(seed),
			});
			const response = await SessionService.startSession(experimentId, {
				participant,
				participantCondition: condition,
				browser_info: currentBrowserInfo(),
				seed,
				plan: queue.map((entry) => ({
					planIndex: entry.planIndex ?? entry.index,
					stepUid: entry.step.uid,
					rowUid: entry.row.uid,
				})),
			});
			const session = { experimentId, ...response.data.data };
			writeSessionPointer(session);
			recorderRef.current = new ResultSessionRecorder(session);
			nextSeqRef.current = 0;
			interruptedPlanIndexRef.current = null;

			setParticipantCondition(condition);
			setRunPlan({ queue, startIndex: 0 });
			setSessionStarted(true);
			setStep("experiment");
		} catch (err) {
			const message =
				isAxiosError(err) && typeof err.response?.data?.message === "string"
					? err.response.data.message
					: "Failed to start experiment. Please contact the researcher.";
			setError(message);
		} finally {
			setIsStarting(false);
		}
	};

	const resumeExperiment = async () => {
		if (!resumeInfo) return;
		const { session } = resumeInfo;

		setIsStarting(true);
		try {
			// Steps this browser holds but the server lacks go first, so the resume point is right.
			const recorder = new ResultSessionRecorder(session);
			const before = (await SessionService.getSession(session)).data.data;
			await recorder.restoreBackup(before.savedStepCount);
			await recorder.whenSaved(SAVE_TIMEOUT_MS);
			const state = (await SessionService.getSession(session)).data.data;

			const queue = buildExecutionQueue(definition, {
				participantCondition: state.participantCondition,
				random: createSeededRandom(state.seed),
			});
			const planMatches =
				queue.length === state.plan.length &&
				queue.every(
					(entry, index) =>
						entry.step.uid === state.plan[index].stepUid &&
						entry.row.uid === state.plan[index].rowUid
				);
			if (!planMatches) {
				setError(
					"This experiment has changed since your session started, so it cannot be resumed. Please contact the researcher."
				);
				return;
			}

			recorderRef.current = recorder;
			nextSeqRef.current = state.savedStepCount;
			setParticipant({ name: state.participant.name ?? "", email: state.participant.email ?? "" });
			setParticipantCondition(state.participantCondition);

			const resumeIndex = state.lastPlanIndex === null ? 0 : state.lastPlanIndex + 1;
			if (resumeIndex >= queue.length) {
				await finishSession();
				return;
			}

			await SessionService.recordResume(session, {
				fromSeq: state.savedStepCount,
				fromPlanIndex: resumeIndex,
				browser_info: currentBrowserInfo(),
			});
			interruptedPlanIndexRef.current = resumeIndex;
			setRunPlan({
				queue: withResumeRecalibration(definition, queue, resumeIndex),
				startIndex: resumeIndex,
			});
			setSessionStarted(true);
			setStep("experiment");
		} catch {
			setError(
				"Could not resume your session. Check your internet connection and reload the page."
			);
		} finally {
			setIsStarting(false);
		}
	};

	const startAsNewParticipant = () => {
		clearSessionPointer(experimentId);
		setResumeInfo(null);
		setStep("welcome");
	};

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

	if (step === "loading") {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Spinner size="large" />
				</S.CompletionContainer>
			</S.Container>
		);
	}

	if (step === "resume" && resumeInfo) {
		const name = resumeInfo.state.participant.name;
		return (
			<S.Container>
				<S.WelcomeContainer>
					<Typography variant="h2">Welcome back{name ? `, ${name}` : ""}</Typography>
					<Typography>
						Your session was interrupted. You can continue where you left off.
					</Typography>
					{experimentNeedsEyeTracking && (
						<Typography>You will set up and calibrate the camera again first.</Typography>
					)}
					<S.ButtonGroup>
						<Button colorScheme="secondary" onClick={startAsNewParticipant}>
							I am a different participant
						</Button>
						<Button
							colorScheme="primary"
							onClick={() => void resumeExperiment()}
							state={{ disabled: isStarting }}
						>
							{isStarting ? "Resuming..." : "Continue"}
						</Button>
					</S.ButtonGroup>
				</S.WelcomeContainer>
			</S.Container>
		);
	}

	if (step === "saving" && saveError) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Typography variant="h3">Your responses are not saved yet</Typography>
					<Typography>{saveError}</Typography>
					<Typography>
						Check your internet connection and try again. If it keeps failing, download your
						responses and send the file to the researcher.
					</Typography>
					<S.ButtonGroup>
						<Button colorScheme="secondary" onClick={downloadResponses}>
							Download my responses
						</Button>
						<Button colorScheme="primary" onClick={() => void finishSession()}>
							Try again
						</Button>
					</S.ButtonGroup>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	if (step === "welcome" && unsupportedBrowser) {
		const copyLink = () => {
			void navigator.clipboard
				?.writeText(window.location.href)
				.then(() => setLinkCopied(true))
				.catch(() => setLinkCopied(false));
		};
		return (
			<S.Container>
				<S.WelcomeContainer>
					<Typography variant="h2">Navegador não compatível</Typography>
					<Typography>
						Este teste usa rastreamento ocular e funciona apenas no Google Chrome ou no
						Microsoft Edge, em um computador com webcam.
					</Typography>
					<Typography>
						Copie este link e abra-o no Chrome ou no Edge para participar.
					</Typography>
					<S.ButtonGroup>
						<Button colorScheme="primary" onClick={copyLink}>
							{linkCopied ? "Link copiado!" : "Copiar link"}
						</Button>
					</S.ButtonGroup>
				</S.WelcomeContainer>
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

	if (step === "saving" || isStarting) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Spinner size="large" />
					<Typography variant="body-1">
						{step === "saving"
							? "Saving your responses. Please do not close this window..."
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
			key={`${participantCondition ?? "default"}:${runPlan?.startIndex ?? 0}`}
			definition={definition}
			participantCondition={participantCondition}
			runPlan={runPlan}
			onStepComplete={handleStepComplete}
			onFinish={handleFinish}
		/>
	);
};

export default ExperimentEngineRuntime;
