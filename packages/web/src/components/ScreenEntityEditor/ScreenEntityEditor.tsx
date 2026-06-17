import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Save, Play, X } from "react-feather";
import { useDispatch, useSelector } from "react-redux";
import type {
	ScreenEntity,
	ScreenChildEntity,
	ScreenBehaviorEntity,
	GridType,
	ScreenCompletionData,
	SpreadsheetRow,
} from "@/@types/screen.model";
import type { ItemPosition } from "@/@types";
import { screenEntityEditorActions, type StoreDispatch, type StoreState } from "@/store";
import { getPositionsMap } from "@/utils/gridPositions";
import ScreenEntityRenderer from "@/components/ScreenEntityRenderer/ScreenEntityRenderer";
import { screenHasAudioProgress } from "@/utils/audioProgressUtils";
import {
	applyRowPresentationForStep,
	defaultLateralCounterbalanceConfig,
} from "@/utils/lateralCounterbalanceUtils";
import EntityCanvas from "./EntityCanvas";
import ChildrenTab from "./ChildrenTab";
import BehaviorsTab from "./BehaviorsTab";
import PropertiesTab from "./PropertiesTab";
import EntityCatalog from "./EntityCatalog";
import S from "./ScreenEntityEditor.styles";

type PanelTab = "children" | "behaviors" | "properties";

// --- Default entity factories ---

function defaultChildEntity(
	kind: ScreenChildEntity["kind"],
	order: number
): ScreenChildEntity {
	const base = {
		uid: crypto.randomUUID(),
		name: kind,
		placement: { area: "content" as const, position: "C" as ItemPosition, order },
	};
	switch (kind) {
		case "AudioPlayer":
			return { ...base, kind, props: { audioSrc: "" }, phase: "stimulus" as const };
		case "Image":
			return { ...base, kind, props: { imageSrc: "" }, phase: "stimulus" as const };
		case "Text":
			return { ...base, kind, props: { text: "" }, phase: "all" as const };
		case "RatingScale":
			return {
				...base,
				kind,
				props: { prompt: "", scale: ["1", "2", "3", "4", "5"] },
				phase: "response" as const,
			};
		case "TextHighlighter":
			return { ...base, kind, props: { text: "" }, phase: "response" as const };
		case "ContinueButton":
			return { ...base, kind, props: { label: "Continue" }, phase: "ready" as const };
	}
}

function defaultBehaviorEntity(kind: ScreenBehaviorEntity["kind"]): ScreenBehaviorEntity {
	const uid = crypto.randomUUID();
	switch (kind) {
		case "EyeTracking":
			return {
				uid,
				kind,
				name: "Eye Tracking",
				props: {
					startOn: "audio-start" as const,
					stopOn: "audio-end" as const,
					targets: "all-trackable" as const,
				},
			};
		case "AdvanceRule":
			return {
				uid,
				kind,
				name: "Advance Rule",
				props: { when: "continue-click" as const },
			};
		case "FixationGate":
			return {
				uid,
				kind,
				name: "Fixation Gate",
				props: { durationMs: 3000, reveal: "all-stimulus" as const },
			};
		case "AudioProgress":
			return {
				uid,
				kind,
				name: "Audio Progress",
				props: { label: "Audio" },
			};
		case "LateralCounterbalance":
			return {
				uid,
				kind,
				name: "Lateral Counterbalance",
				props: defaultLateralCounterbalanceConfig(),
			};
	}
}

// --- Component ---

interface ScreenEntityEditorProps {
	screen?: ScreenEntity;
	previewRow?: SpreadsheetRow;
	onSave?: (screen: ScreenEntity) => void;
	onBack?: () => void;
}

const ScreenEntityEditor: React.FC<ScreenEntityEditorProps> = ({
	screen,
	previewRow,
	onSave,
	onBack,
}) => {
	const dispatch = useDispatch<StoreDispatch>();
	const editorState = useSelector((state: StoreState) => state.screenEntityEditor);

	const [activeTab, setActiveTab] = useState<PanelTab>("children");
	const [selectedUid, setSelectedUid] = useState<string | null>(null);
	const [showCatalog, setShowCatalog] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [previewDone, setPreviewDone] = useState(false);
	const [previewSeed, setPreviewSeed] = useState(0);

	useEffect(() => {
		if (screen) {
			dispatch(screenEntityEditorActions.loadScreen(screen));
		} else {
			dispatch(screenEntityEditorActions.reset());
		}
		return () => {
			dispatch(screenEntityEditorActions.reset());
		};
	}, [screen, dispatch]);

	const selectedEntity = useMemo(() => {
		if (!selectedUid) return null;
		const child = editorState.children.find((c) => c.uid === selectedUid);
		if (child) return child;
		const behavior = editorState.behaviors.find((b) => b.uid === selectedUid);
		return behavior ?? null;
	}, [selectedUid, editorState.children, editorState.behaviors]);

	const handleSelect = useCallback((uid: string | null) => {
		setSelectedUid(uid);
		setActiveTab("properties");
	}, []);

	const handleDeleteChild = useCallback(
		(uid: string) => {
			dispatch(screenEntityEditorActions.removeChild(uid));
			if (selectedUid === uid) setSelectedUid(null);
		},
		[dispatch, selectedUid]
	);

	const handleAddChild = useCallback(
		(kind: ScreenChildEntity["kind"]) => {
			const nextOrder =
				editorState.children.length === 0
					? 0
					: Math.max(...editorState.children.map((child) => child.placement.order)) + 1;

			const entity = defaultChildEntity(kind, nextOrder);
			dispatch(screenEntityEditorActions.addChild(entity));
			setSelectedUid(entity.uid);
			setActiveTab("properties");
			setShowCatalog(false);
		},
		[dispatch, editorState.children.length]
	);

	const handleToggleBehavior = useCallback(
		(kind: ScreenBehaviorEntity["kind"]) => {
			const existing = editorState.behaviors.find((b) => b.kind === kind);
			if (existing) {
				dispatch(screenEntityEditorActions.removeBehavior(existing.uid));
				if (selectedUid === existing.uid) setSelectedUid(null);
			} else {
				const entity = defaultBehaviorEntity(kind);
				dispatch(screenEntityEditorActions.addBehavior(entity));
				setSelectedUid(entity.uid);
				setActiveTab("properties");
			}
		},
		[dispatch, editorState.behaviors, selectedUid]
	);

	const handleMoveEntity = useCallback(
		(uid: string, position: ItemPosition) => {
			const mapped = getPositionsMap(position);
			dispatch(
				screenEntityEditorActions.updateChildPlacement({
					uid,
					placement: { area: mapped.area, position },
				})
			);
		},
		[dispatch]
	);

	const handleSetGridType = useCallback(
		(type: GridType) => {
			dispatch(screenEntityEditorActions.setGridType(type));
		},
		[dispatch]
	);

	const buildScreen = useCallback((): ScreenEntity => ({
		uid: editorState.screenUid || crypto.randomUUID(),
		kind: "Screen",
		name: editorState.name || "Untitled Screen",
		props: {
			grid: { type: editorState.gridType, subtype: editorState.gridSubtype },
		},
		children: [...editorState.children],
		behaviors: [...editorState.behaviors],
	}), [editorState]);

	const handleSave = useCallback(() => {
		onSave?.(buildScreen());
	}, [buildScreen, onSave]);

	const handleOpenPreview = useCallback(() => {
		setPreviewDone(false);
		setPreviewSeed((seed) => seed + 1);
		setShowPreview(true);
	}, []);

	const handlePreviewComplete = useCallback((_data: ScreenCompletionData) => {
		setPreviewDone(true);
	}, []);

	// Strip EyeTracking behaviors for preview — requires live webcam context
	const previewScreen = useMemo((): ScreenEntity => {
		const s = buildScreen();
		return {
			...s,
			behaviors: (s.behaviors ?? []).filter((b) => b.kind !== "EyeTracking"),
		};
	}, [buildScreen]);

	const previewPresentation = useMemo(() => {
		if (!previewRow) {
			return { row: previewRow, presentation: undefined };
		}

		return applyRowPresentationForStep(previewRow, previewScreen);
	}, [previewRow, previewScreen, previewSeed]);

	const gridTypes: GridType[] = ["1x1", "2x2", "3x3"];

	return (
		<S.Container>
			{/* Left: Canvas */}
			<S.CanvasPanel>
				<S.CanvasToolbar>
					{onBack && (
						<S.ToolbarButton onClick={onBack}>
							<ArrowLeft size={14} />
							Back
						</S.ToolbarButton>
					)}
					<S.ToolbarInput
						value={editorState.name}
						onChange={(e) =>
							dispatch(screenEntityEditorActions.setName(e.target.value))
						}
						placeholder="Screen name"
						style={{ maxWidth: 200, flex: 1 }}
					/>
					<div style={{ display: "flex", gap: 3 }}>
						{gridTypes.map((type) => (
							<S.GridTypePill
								key={type}
								$active={editorState.gridType === type}
								onClick={() => handleSetGridType(type)}
							>
								{type}
							</S.GridTypePill>
						))}
					</div>
					<S.ToolbarButton onClick={handleOpenPreview}>
						<Play size={14} />
						Preview
					</S.ToolbarButton>
					{onSave && (
						<S.ToolbarButton $variant="primary" onClick={handleSave}>
							<Save size={14} />
							Save
						</S.ToolbarButton>
					)}
				</S.CanvasToolbar>
				<S.CanvasArea>
					<EntityCanvas
						gridType={editorState.gridType}
						selectedUid={selectedUid}
						onSelectEntity={handleSelect}
						onMoveEntity={handleMoveEntity}
					>
						{editorState.children}
					</EntityCanvas>
				</S.CanvasArea>
			</S.CanvasPanel>

			{/* Right: Panel */}
			<S.RightPanel>
				<S.PanelTabs>
					<S.PanelTab
						$active={activeTab === "children"}
						onClick={() => setActiveTab("children")}
					>
						Children
					</S.PanelTab>
					<S.PanelTab
						$active={activeTab === "behaviors"}
						onClick={() => setActiveTab("behaviors")}
					>
						Behaviors
					</S.PanelTab>
					<S.PanelTab
						$active={activeTab === "properties"}
						onClick={() => setActiveTab("properties")}
					>
						Properties
					</S.PanelTab>
				</S.PanelTabs>

				<S.PanelContent>
					{activeTab === "children" && (
						<ChildrenTab
							selectedUid={selectedUid}
							onSelect={handleSelect}
							onDelete={handleDeleteChild}
							onShowCatalog={() => setShowCatalog(true)}
						>
							{editorState.children}
						</ChildrenTab>
					)}
					{activeTab === "behaviors" && (
						<BehaviorsTab
							behaviors={editorState.behaviors}
							selectedUid={selectedUid}
							onSelect={handleSelect}
							onToggle={handleToggleBehavior}
						/>
					)}
					{activeTab === "properties" && (
						<PropertiesTab
							entity={selectedEntity}
							gridType={editorState.gridType}
							onUpdateName={(uid, name) =>
								dispatch(screenEntityEditorActions.updateChildName({ uid, name }))
							}
							onUpdateChildProps={(uid, props) =>
								dispatch(screenEntityEditorActions.updateChildProps({ uid, props }))
							}
							onUpdateChildPlacement={(uid, placement) =>
								dispatch(
									screenEntityEditorActions.updateChildPlacement({ uid, placement })
								)
							}
							onUpdateBehaviorProps={(uid, props) =>
								dispatch(
									screenEntityEditorActions.updateBehaviorProps({ uid, props })
								)
							}
						/>
					)}
				</S.PanelContent>
			</S.RightPanel>

			{/* Entity Catalog overlay */}
			{showCatalog && (
				<EntityCatalog
					onAdd={handleAddChild}
					onClose={() => setShowCatalog(false)}
				/>
			)}

			{/* Preview overlay */}
			{showPreview && (
				<S.PreviewOverlay>
					<S.PreviewBar>
						<S.PreviewLabel>Preview — {editorState.name || "Untitled Screen"}</S.PreviewLabel>
						<S.ToolbarButton onClick={() => setShowPreview(false)}>
							<X size={14} />
							Close
						</S.ToolbarButton>
					</S.PreviewBar>
					<S.PreviewScreenArea>
						{previewDone ? (
							<S.PreviewComplete>
								<span>Screen complete</span>
								<S.ToolbarButton onClick={() => { setPreviewDone(false); setPreviewSeed((seed) => seed + 1); }}>
									<Play size={14} />
									Replay
								</S.ToolbarButton>
							</S.PreviewComplete>
						) : (
							<ScreenEntityRenderer
								key={`${previewScreen.uid}-${previewRow?.uid ?? "preview"}-${previewSeed}`}
								screen={previewScreen}
								row={previewPresentation.row}
								onComplete={handlePreviewComplete}
								audioProgress={
									screenHasAudioProgress(previewScreen)
										? { current: 1, total: 1 }
										: null
								}
							/>
						)}
					</S.PreviewScreenArea>
				</S.PreviewOverlay>
			)}
		</S.Container>
	);
};

export default ScreenEntityEditor;
