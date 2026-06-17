import { useState } from "react";
import { useParams } from "react-router";
import { Button, Input, Typography, Spinner } from "@leux/ui";
import { useExperiment } from "@/hooks";
import {
	AudioRatingTrial,
	FeedbackSurveyTrial,
	InstructionTrial,
	ScreenTrial,
} from "@/components/trials";
import S from "./ExperimentParticipantMos.styles";

type Step = "welcome" | "consent" | "form" | "experiment" | "completed";

const ExperimentParticipantMos = () => {
	const params = useParams();
	const experimentId = params.id as string;

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
	} = useExperiment({
		experimentId,
		experimentType: "mos",
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
							Gostaríamos de convidá-lo(a) para participar como voluntário(a) de uma pesquisa de projeto para realizar um novo teste em que a avaliação da qualidade da fala é feita com captura de dados oculares; nomeamos este teste de classificação da qualidade da fala com captura de dados oculares de Eye-Tracking-MOS.
						</p>
						<p>
							Duas imagens serão fornecidas: de um falante real, indicando fala natural e de um robô/avatar, indicando fala sintetizada. Os avaliadores devem indicar, via tempo de duração e o tempo de fixação do olhar qual das imagens aquele estímulo se refere.
						</p>
						<p>
							A pesquisa compreende duas etapas de coleta de dados sobre avaliação da qualidade da fala de sistemas de síntese de fala (do inglês, Text-To-Speech ou TTS):
						</p>
						<p>
							(1) coleta de valores numéricos de uma escala de 5 pontos (teste MOS), selecionados via click de mouse, durante a audição de amostras de fala.<br />
							(2) coleta de dados oculares, por meio de webcam, durante a audição de amostras de fala (Eyetracking-MOS).
						</p>
						<p>
							A pesquisa será realizada por meio de uma plataforma web. Os avaliadores receberão o convite para participar via e-mail, com o link do teste e a avaliação poderá ser realizada das residências ou da universidade, em um lugar sem barulho. O avaliador é aconselhado a usar fones de ouvido.
						</p>
						<hr />
						<p>
							Esclarecemos que sua participação é totalmente voluntária, podendo recusar-se a participar, ou mesmo desistir a qualquer momento, sem que isto acarrete qualquer ônus ou prejuízo a sua pessoa. Esclarecemos, também, que  informações, como o IP de seu computador não será armazenado após o teste. Imagens ou vídeos da sua face durante a captura da webcam também não são armazenados, apenas as coordenadas da fixação ocular na tela.
						</p>
						<p>
							Os pesquisadores tratarão a sua identidade com padrões profissionais de sigilo, atendendo a legislação brasileira (Resolução Nº 466/12 do Conselho Nacional de Saúde), utilizando as informações somente para fins acadêmicos e científicos.
						</p>
						<hr />
						<p>
							É possível que você sinta leve desconforto por se manter sentado(a) e parcialmente imóvel durante a sessão. No entanto, buscamos minimizar ao máximo esse desconforto, pedindo que realize a tarefa em local tranquilo e confortável e realizaremos o teste com a duração média de 30 minutos. Você encontra-se livre para encerrar a atividade a qualquer momento. Os riscos envolvidos na realização da tarefa são mínimos, similares aos envolvidos em atividades diárias como uso de computador e de televisão.
						</p>
						<p>
							Você não pagará e nem será remunerado(a) por sua participação. Sua participação voluntária irá, contudo, contribuir para as pesquisas em Processamento de Línguas Naturais, sobre avaliação e desenvolvimento de métodos de síntese de fala.
						</p>
						<hr />
						<p>
							Após a leitura deste documento e de ter tido a oportunidade de esclarecer todas as minhas dúvidas, acredito estar suficientemente informado(a), ficando claro para mim que minha participação é voluntária e que posso retirar este consentimento a qualquer momento sem penalidades ou perda de qualquer benefício. Estou ciente também dos objetivos da pesquisa, dos procedimentos aos quais serei submetido(a), dos possíveis danos ou riscos deles provenientes e da garantia de confidencialidade e esclarecimentos sempre que desejar.
						</p>
						<p>
							<strong>Diante do exposto expresso minha concordância de espontânea vontade em participar deste estudo.</strong>
						</p>
						<p>
							<strong>Este termo de consentimento livre e esclarecido (TCLE) é aceito com o clique no botão ACEITAR.</strong>
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
					<h3 style={{ marginBottom: "24px", textAlign: "center" }}>
						Participant Information
					</h3>
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
							state={{ disabled: !canProceedFromForm }}
						>
							Iniciar Experimento
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
					<Typography>
						The experiment is now complete. Your responses have been recorded.
					</Typography>
					<Typography variant="caption">
						You may now close this window.
					</Typography>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	// Experiment running
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
			{!isLoading && !isSubmitting && currentTrial && (
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

export default ExperimentParticipantMos;
