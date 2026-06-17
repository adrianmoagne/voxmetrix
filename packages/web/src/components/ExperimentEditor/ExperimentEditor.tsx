import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Package, Table, Settings, Save, Play, Check } from "react-feather";
import type { ExperimentDefinition, ScreenEntity, ParticipantAssignmentConfig } from "@/@types/screen.model";
import { resolveAssignmentGroups } from "@/utils/participantAssignmentUtils";
import { blockEditorActions, type StoreDispatch, type StoreState } from "@/store";
import { ScreenEntityEditor } from "@/components/ScreenEntityEditor";
import { SpreadsheetPanel } from "@/components/SpreadsheetPanel";
import { StepPropertyForm } from "@/components/StepPropertyForm";
import { DrillInView } from "@/components/DrillInView";
import { BlocksView } from "@/components/BlocksView";
import { SettingsView, SettingsViewStyles as SV } from "@/components/SettingsView";
import S from "./ExperimentEditor.styles";

type View = "blocks" | "data" | "settings";

interface ExperimentEditorProps {
	experiment?: ExperimentDefinition;
	onSave?: (experiment: ExperimentDefinition) => void;
	onRun?: (experiment: ExperimentDefinition) => void;
}

const ExperimentEditor: React.FC<ExperimentEditorProps> = ({ experiment, onSave, onRun }) => {
	const dispatch = useDispatch<StoreDispatch>();
	const state = useSelector((s: StoreState) => s.blockEditor);
	const screenEditorState = useSelector((s: StoreState) => s.screenEntityEditor);

	const [uid] = useState(experiment?.uid ?? crypto.randomUUID());
	const [name, setName] = useState(experiment?.name ?? "");
	const [description, setDescription] = useState(experiment?.description ?? "");
	const [view, setView] = useState<View>("blocks");
	const [editingStep, setEditingStep] = useState<{ blockUid: string; stepUid: string } | null>(null);
	const [showSaveToast, setShowSaveToast] = useState(false);

	useEffect(() => {
		if (experiment) {
			dispatch(blockEditorActions.loadExperiment({
				blocks: experiment.blocks,
				spreadsheet: experiment.spreadsheet,
				participantAssignment: experiment.participantAssignment,
			}));
			setName(experiment.name);
			setDescription(experiment.description ?? "");
		} else {
			dispatch(blockEditorActions.reset());
			dispatch(blockEditorActions.addBlock());
		}
		return () => { dispatch(blockEditorActions.reset()); };
	}, [experiment, dispatch]);

	const buildDefinition = useCallback((): ExperimentDefinition => {
		const blocks = structuredClone(state.blocks);

		if (editingStep && screenEditorState.screenUid === editingStep.stepUid) {
			const block = blocks.find((b) => b.uid === editingStep.blockUid);
			const stepIndex = block?.steps.findIndex((s) => s.uid === editingStep.stepUid) ?? -1;

			if (block && stepIndex !== -1 && block.steps[stepIndex]?.kind === "Screen") {
				const screen: ScreenEntity = {
					uid: screenEditorState.screenUid,
					kind: "Screen",
					name: screenEditorState.name || "Untitled Screen",
					props: {
						grid: {
							type: screenEditorState.gridType,
							subtype: screenEditorState.gridSubtype,
						},
					},
					children: structuredClone(screenEditorState.children),
					behaviors: structuredClone(screenEditorState.behaviors),
				};
				block.steps[stepIndex] = screen;
			}
		}

		return {
			schemaVersion: 2, uid,
			name: name || "Untitled Experiment",
			description: description || undefined,
			blocks,
			spreadsheet: structuredClone(state.spreadsheet),
			participantAssignment: state.participantAssignment?.enabled
				? structuredClone(state.participantAssignment)
				: undefined,
		};
	}, [uid, name, description, state.blocks, state.spreadsheet, state.participantAssignment, editingStep, screenEditorState]);

	const handleSave = useCallback(() => {
		onSave?.(buildDefinition());
		setShowSaveToast(true);
		setTimeout(() => setShowSaveToast(false), 2000);
	}, [buildDefinition, onSave]);

	const editingBlock = editingStep
		? state.blocks.find((b) => b.uid === editingStep.blockUid)
		: null;
	const editingStepData = editingBlock
		? editingBlock.steps.find((s) => s.uid === editingStep?.stepUid)
		: null;
	const editingPreviewRow = editingStep
		? state.spreadsheet.rows.find((r) => r.blockUid === editingStep.blockUid)
		: undefined;

	const assignment = state.participantAssignment;
	const assignmentGroupsPreview = resolveAssignmentGroups({
		schemaVersion: 2,
		uid,
		name,
		blocks: state.blocks,
		spreadsheet: state.spreadsheet,
		participantAssignment: assignment,
	});

	const updateAssignment = useCallback(
		(next: ParticipantAssignmentConfig | undefined) => {
			dispatch(blockEditorActions.setParticipantAssignment(next));
		},
		[dispatch]
	);

	const renderContent = () => {
		if (view === "blocks" && editingStep && editingStepData && editingBlock) {
			return (
				<DrillInView
					onBack={() => setEditingStep(null)}
					breadcrumb={<>{editingBlock.name} / <span>{editingStepData.name}</span></>}
				>
					{editingStepData.kind === "Screen" ? (
						<ScreenEntityEditor
							screen={editingStepData as ScreenEntity}
							previewRow={editingPreviewRow}
							onSave={(screen) => dispatch(blockEditorActions.updateStep(screen))}
						/>
					) : (
						<StepPropertyForm step={editingStepData} dispatch={dispatch as StoreDispatch} />
					)}
				</DrillInView>
			);
		}

		switch (view) {
			case "blocks":
				return (
					<BlocksView
						onEditStep={(blockUid, stepUid) => {
							dispatch(blockEditorActions.selectBlock(blockUid));
							setEditingStep({ blockUid, stepUid });
						}}
					/>
				);
			case "data":
				return <SpreadsheetPanel />;
			case "settings":
				return (
					<SettingsView
						title="Experiment Settings"
						fields={[
							{
								label: "Name",
								content: (
									<SV.Input
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Experiment name"
									/>
								),
							},
							{
								label: "Description",
								content: (
									<SV.Textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Describe the experiment..."
									/>
								),
							},
							{ label: "UID", content: <SV.Readonly>{uid}</SV.Readonly> },
							{ label: "Schema Version", content: <SV.Readonly>2</SV.Readonly> },
							{
								label: "Participant assignment",
								content: (
									<>
										<label style={{ display: "flex", alignItems: "center", gap: 8 }}>
											<input
												type="checkbox"
												checked={assignment?.enabled ?? false}
												onChange={(e) => {
													if (e.target.checked) {
														updateAssignment({
															enabled: true,
															mode: assignment?.mode ?? "random",
															groups: assignment?.groups,
														});
													} else {
														updateAssignment(undefined);
													}
												}}
											/>
											Enable between-subjects conditions (A/B)
										</label>
										{assignment?.enabled && (
											<div style={{ marginTop: 12, display: "grid", gap: 12 }}>
												<div>
													<div style={{ marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
														Assignment mode
													</div>
													<SV.Input
														as="select"
														value={assignment.mode ?? "random"}
														onChange={(e) =>
															updateAssignment({
																...assignment,
																mode: e.target.value as ParticipantAssignmentConfig["mode"],
															})
														}
													>
														<option value="random">Random at start</option>
														<option value="url">From URL (?condition=)</option>
													</SV.Input>
												</div>
												<div>
													<div style={{ marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
														Groups (optional)
													</div>
													<SV.Input
														value={(assignment.groups ?? []).join(", ")}
														placeholder="A, B — leave empty to use spreadsheet row conditions"
														onChange={(e) => {
															const groups = e.target.value
																.split(",")
																.map((group) => group.trim())
																.filter(Boolean);
															updateAssignment({
																...assignment,
																groups: groups.length > 0 ? groups : undefined,
															});
														}}
													/>
												</div>
												<div style={{ fontSize: 12, color: "#6b7280" }}>
													Active groups:{" "}
													{assignmentGroupsPreview.length > 0
														? assignmentGroupsPreview.join(", ")
														: "none — tag spreadsheet rows with a condition column"}
												</div>
											</div>
										)}
									</>
								),
							},
						]}
					/>
				);
		}
	};

	return (
		<S.Container>
			<S.TopBar>
				<S.ExperimentName
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Experiment name"
				/>
				<div style={{ flex: 1 }} />
				{onRun && (
					<S.ActionButton $variant="run" onClick={() => onRun(buildDefinition())}>
						<Play size={12} />
						Run
					</S.ActionButton>
				)}
				{onSave && (
					<S.ActionButton $variant="primary" onClick={handleSave}>
						<Save size={12} />
						Save Experiment
					</S.ActionButton>
				)}
			</S.TopBar>

			<S.Shell>
				<S.Sidebar>
					<S.SidebarItem
						$active={view === "blocks"}
						onClick={() => { setView("blocks"); setEditingStep(null); }}
						title="Blocks"
					>
						<Package size={18} />
						<S.SidebarLabel>Blocks</S.SidebarLabel>
					</S.SidebarItem>
					<S.SidebarItem
						$active={view === "data"}
						onClick={() => { setView("data"); setEditingStep(null); }}
						title="Data"
					>
						<Table size={18} />
						<S.SidebarLabel>Data</S.SidebarLabel>
					</S.SidebarItem>
					<S.SidebarItem
						$active={view === "settings"}
						onClick={() => { setView("settings"); setEditingStep(null); }}
						title="Settings"
					>
						<Settings size={18} />
						<S.SidebarLabel>Settings</S.SidebarLabel>
					</S.SidebarItem>
				</S.Sidebar>

				<S.Content>{renderContent()}</S.Content>
			</S.Shell>

			<S.SaveToast $visible={showSaveToast}>
				<Check size={14} />
				Experiment saved
			</S.SaveToast>
		</S.Container>
	);
};

export default ExperimentEditor;
