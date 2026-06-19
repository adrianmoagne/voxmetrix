import { useEffect, useState } from "react";
import { useParams } from "react-router";
import type { ExperimentDefinition } from "@/@types/screen.model";
import { ExperimentEditor } from "@/components/ExperimentEditor";
import ExperimentEngineRuntime from "@/pages/ExperimentParticipantRuntime/ExperimentEngineRuntime";
import S from "@/pages/ExperimentParticipantRuntime/ExperimentParticipantRuntime.styles";
import { ExperimentService } from "@/api/services";

const Experiment: React.FC = () => {
	const { id: experimentId } = useParams<{ id: string }>();
	const [draft, setDraft] = useState<ExperimentDefinition | null>(null);
	const [isPreviewing, setIsPreviewing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!experimentId) return;
		ExperimentService.fetchExperimentById(experimentId)
			.then((res) => {
				const definition = res.data?.data?.definition as
					| ExperimentDefinition
					| undefined;
				if (!definition) {
					setError("Experiment definition not found");
					return;
				}
				setDraft(definition);
			})
			.catch((err) => {
				console.error("Error fetching experiment:", err);
				setError("Failed to load experiment");
			});
	}, [experimentId]);

	const handleSave = async (def: ExperimentDefinition) => {
		setDraft(def);
		if (!experimentId) return;
		try {
			await ExperimentService.updateExperiment(experimentId, {
				alias: def.name,
				description: def.description,
				definition: def,
			});
		} catch (err) {
			console.error("Failed to save experiment:", err);
		}
	};

	if (error) {
		return <div style={{ padding: 24 }}>{error}</div>;
	}

	if (!draft) {
		return <div style={{ padding: 24 }}>Loading…</div>;
	}

	if (isPreviewing) {
		return (
			<S.RuntimeOverlay>
				<ExperimentEngineRuntime
					experimentId={draft.uid}
					definition={draft}
					isPreview
					onExit={() => setIsPreviewing(false)}
				/>
			</S.RuntimeOverlay>
		);
	}

	return (
		<div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
			<ExperimentEditor
				experiment={draft}
				experimentId={experimentId}
				onSave={handleSave}
				onRun={(def) => {
					setDraft(def);
					setIsPreviewing(true);
				}}
			/>
		</div>
	);
};

export default Experiment;
