import { useState } from "react";
import { Button, Input, Spinner, Typography } from "@leux/ui";
import { useExperiment } from "@/hooks";
import { ExperimentTrialRenderer } from "@/components";
import type { ExperimentType } from "@/@types";
import S from "./ExperimentParticipantRuntime.styles";

type Step = "welcome" | "consent" | "form" | "experiment" | "completed";

interface ExperimentParticipantRuntimeProps {
	experimentId: string;
	experimentType?: ExperimentType;
}

const ExperimentParticipantRuntime: React.FC<ExperimentParticipantRuntimeProps> = ({
	experimentId,
	experimentType,
}) => {
	const [step, setStep] = useState<Step>("welcome");
	const [participant, setParticipant] = useState({
		name: "",
		email: "",
	});

	const {
		currentTrial,
		completeTrial,
		isLoading,
		isSubmitting,
		isFinished,
		error,
		startExperiment,
		totalAudioTrials,
		audioTrialCounter,
		webgazer,
		calibrationConfig,
		needsRecalibration,
		triggerRecalibration,
	} = useExperiment({
		experimentId,
		experimentType,
		participant,
		isPreview: false,
		onFinish: () => {
			setStep("completed");
		},
	});

	const canProceedFromForm =
		participant.name.trim().length > 0 && participant.email.trim().length > 0;

	const handleStartExperiment = () => {
		setStep("experiment");
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
					<Typography variant="caption">
						Please contact the researcher if this problem persists.
					</Typography>
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
					<S.ButtonGroup>
						<Button colorScheme="primary" onClick={() => setStep("consent")}>
							Next
						</Button>
					</S.ButtonGroup>
				</S.WelcomeContainer>
			</S.Container>
		);
	}

	if (step === "consent") {
		return (
			<S.Container>
				<S.ConsentContainer>
					<Typography variant="h3">Termo de Consentimento Livre e Esclarecido</Typography>
					<S.ConsentText>
						<p>
							Gostaríamos de convidá-lo(a) para participar como voluntário(a) de uma
							pesquisa.
						</p>
						<p>
							Sua participação é voluntária e você pode desistir a qualquer momento sem
							prejuízo.
						</p>
						<p>
							Os dados serão tratados com confidencialidade e usados apenas para fins
							acadêmicos e científicos.
						</p>
						<p>
							<strong>
								Este termo de consentimento livre e esclarecido (TCLE) é aceito com o
								clique no botão ACEITAR.
							</strong>
						</p>
					</S.ConsentText>
					<S.ButtonGroup>
						<Button colorScheme="secondary" onClick={() => setStep("welcome")}>
							Voltar
						</Button>
						<Button colorScheme="primary" onClick={() => setStep("form")}>
							Aceitar
						</Button>
					</S.ButtonGroup>
				</S.ConsentContainer>
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
						<Input
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setParticipant((p) => ({ ...p, name: e.target.value }))
							}
						/>
					</S.FormField>
					<S.FormField>
						<Typography>Email Address</Typography>
						<Input
							type="email"
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setParticipant((p) => ({ ...p, email: e.target.value }))
							}
						/>
					</S.FormField>
					<S.ButtonGroup>
						<Button colorScheme="secondary" onClick={() => setStep("consent")}>
							Voltar
						</Button>
						<Button
							colorScheme="primary"
							onClick={handleStartExperiment}
							state={{ disabled: !canProceedFromForm || isLoading }}
						>
							{isLoading ? "Carregando..." : "Iniciar Experimento"}
						</Button>
					</S.ButtonGroup>
				</S.FormContainer>
			</S.Container>
		);
	}

	if (step === "completed" || isFinished) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Typography variant="h2">Thank You!</Typography>
					<Typography>The experiment is now complete. Your responses have been recorded.</Typography>
					<Typography variant="caption">You may now close this window.</Typography>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	if (needsRecalibration) {
		return (
			<S.Container>
				<div style={{ textAlign: "center", padding: 40 }}>
					<Typography variant="h3">Recalibration Needed</Typography>
					<Typography>The calibration accuracy is lower than expected.</Typography>
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
			{(isLoading || isSubmitting) && (
				<S.CompletionContainer>
					<Spinner size="large" />
					<Typography variant="body-1">
						{isSubmitting
							? "Submitting your responses. Please do not close this window..."
							: "Loading experiment..."}
					</Typography>
				</S.CompletionContainer>
			)}
			{!isLoading && !isSubmitting && (
				<ExperimentTrialRenderer
					currentTrial={currentTrial}
					completeTrial={completeTrial}
					calibrationConfig={calibrationConfig}
					webgazer={webgazer}
					totalAudioTrials={totalAudioTrials}
					audioTrialCounter={audioTrialCounter}
				/>
			)}
		</S.Container>
	);
};

export default ExperimentParticipantRuntime;
