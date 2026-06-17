import { useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import type { ExperimentDefinition } from "@/@types/screen.model";
import type { IProject } from "@/@types";
import type { StoreState } from "@/store";
import { ExperimentEditor } from "@/components/ExperimentEditor";
import ExperimentEngineRuntime from "@/pages/ExperimentParticipantRuntime/ExperimentEngineRuntime";
import { ExperimentService } from "@/api/services";

const ExperimentCreate: React.FC = () => {
	const { id: projectId } = useParams<{ id: string }>();
	const project = useSelector((state: StoreState) =>
		state.project.projects.find((p: IProject) => p._id === projectId)
	);

	const initialExperiment = useMemo<ExperimentDefinition>(
		() => ({
			schemaVersion: 2,
			uid: crypto.randomUUID(),
			name: project?.alias ?? "New Experiment",
			description: "",
			blocks: [],
			spreadsheet: { columns: [], rows: [] },
		}),
		[project?.alias]
	);

	const [draft, setDraft] = useState<ExperimentDefinition>(initialExperiment);
	const [isPreviewing, setIsPreviewing] = useState(false);
	const experimentIdRef = useRef<string | null>(null);

	const handleSave = async (def: ExperimentDefinition) => {
		setDraft(def);

		try {
			if (experimentIdRef.current) {
				await ExperimentService.updateExperiment(experimentIdRef.current, {
					alias: def.name,
					description: def.description,
					definition: def,
				});
			} else {
				if (!projectId) return;
				const res = await ExperimentService.createExperiment({
					alias: def.name,
					description: def.description,
					status: "draft",
					project_id: projectId,
					definition: def,
				});
				const newId = res.data?.content?.id;
				if (newId) {
					experimentIdRef.current = String(newId);
				}
			}
		} catch (err) {
			console.error("Failed to save experiment:", err);
		}
	};

	if (isPreviewing) {
		return (
			<div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
				<ExperimentEngineRuntime
					experimentId={draft.uid}
					definition={draft}
					isPreview
					onExit={() => setIsPreviewing(false)}
				/>
			</div>
		);
	}

	return (
		<div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
			<ExperimentEditor
				experiment={draft}
				onSave={handleSave}
				onRun={(def) => {
					setDraft(def);
					setIsPreviewing(true);
				}}
			/>
		</div>
	);
};

export default ExperimentCreate;
