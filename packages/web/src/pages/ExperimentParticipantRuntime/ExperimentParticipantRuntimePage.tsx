import { useEffect, useState } from "react";
import { Spinner, Typography } from "@leux/ui";
import { useParams } from "react-router";
import type { ExperimentDefinition } from "@/@types/screen.model";
import { ExperimentService } from "@/api/services";
import ExperimentEngineRuntime from "./ExperimentEngineRuntime";
import S from "./ExperimentParticipantRuntime.styles";

interface ExperimentRunResponse {
	definition?: ExperimentDefinition;
	data?: {
		definition?: ExperimentDefinition;
	};
}

const ExperimentParticipantRuntimePage = () => {
	const params = useParams();
	const experimentId = params.id as string;
	const [definition, setDefinition] = useState<ExperimentDefinition | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		const fetchExperimentRun = async () => {
			if (!experimentId) {
				setError("Missing experiment id.");
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const response =
					await ExperimentService.fetchExperimentForParticipant<ExperimentRunResponse>(
						experimentId
					);
				const responseData = response.data;
				const runDefinition = responseData.definition ?? responseData.data?.definition ?? null;

				if (!isMounted) return;

				if (runDefinition) {
					setDefinition(runDefinition);
					return;
				}

				setError("This experiment is not available in the current runtime format.");
			} catch {
				if (!isMounted) return;
				setError("Failed to load experiment. Please contact the researcher.");
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		fetchExperimentRun();

		return () => {
			isMounted = false;
		};
	}, [experimentId]);

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

	if (error || !definition) {
		return (
			<S.Container>
				<S.CompletionContainer>
					<Typography variant="h3" textColor="danger">
						Error
					</Typography>
					<Typography>{error ?? "Experiment definition not found."}</Typography>
					<Typography variant="caption">
						Please contact the researcher if this problem persists.
					</Typography>
				</S.CompletionContainer>
			</S.Container>
		);
	}

	return (
		<S.RuntimeOverlay>
			<ExperimentEngineRuntime experimentId={experimentId} definition={definition} />
		</S.RuntimeOverlay>
	);
};

export default ExperimentParticipantRuntimePage;
