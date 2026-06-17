import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Spinner, Typography } from "@leux/ui";
import type { ExperimentDefinition } from "@/@types/screen.model";
import { Pages } from "@/@types";
import { ExperimentService } from "@/api/services";
import ExperimentEngineRuntime from "@/pages/ExperimentParticipantRuntime/ExperimentEngineRuntime";
import S from "@/pages/ExperimentParticipantRuntime/ExperimentParticipantRuntime.styles";

const ExperimentPreview = () => {
	const params = useParams();
	const navigate = useNavigate();
	const experimentId = params.id as string;
	const [definition, setDefinition] = useState<ExperimentDefinition | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!experimentId) {
			setError("Missing experiment id.");
			setIsLoading(false);
			return;
		}

		let isMounted = true;
		setIsLoading(true);
		setError(null);

		ExperimentService.fetchExperimentById(experimentId)
			.then((res) => {
				if (!isMounted) return;
				const def = res.data?.data?.definition as ExperimentDefinition | undefined;
				if (!def) {
					setError("Experiment definition not found.");
					return;
				}
				setDefinition(def);
			})
			.catch(() => {
				if (!isMounted) return;
				setError("Failed to load experiment.");
			})
			.finally(() => {
				if (isMounted) setIsLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [experimentId]);

	const handleExit = () => {
		navigate(Pages.Experiment.replace(":id", experimentId));
	};

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
				</S.CompletionContainer>
			</S.Container>
		);
	}

	return (
		<S.RuntimeOverlay>
			<ExperimentEngineRuntime
				experimentId={experimentId}
				definition={definition}
				isPreview
				onExit={handleExit}
			/>
		</S.RuntimeOverlay>
	);
};

export default ExperimentPreview;
