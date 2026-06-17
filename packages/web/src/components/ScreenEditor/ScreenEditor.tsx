import { useState, useEffect } from "react";
import { Typography, Badge, Grid, Box, useModal } from "@leux/ui";
import {
	Image,
	Volume2,
	Type,
	Eye,
	Crosshair,
	Star,
	SkipForward,
	Clock,
	Headphones,
	Edit3,
	Trash2,
	PlusCircle,
	ArrowLeft,
	Grid as FeatherGrid,
} from "react-feather";
import { useTheme } from "@emotion/react";
import { useDispatch, useSelector } from "react-redux";
import S from "./ScreenEditor.styles";
import { createScreenActions, type StoreDispatch, type StoreState } from "@/store";
import {
	ModalId,
	ModalSizes,
	type IScreen,
	type ScreenItem,
	type ItemPosition,
	type ItemAlignment,
	type IMedia,
	type ScreenComponentType,
} from "@/@types";
import type { ScreenComponent } from "@/@types/screen.model";
import { getItemPositionFromMap, getPositionsMap } from "@/utils";
import type { GridType } from "@/@types";
import { Modals } from "@/components";

type BoardScreen = {
	id: string;
	name: string;
	elements: number | null;
	displays?: IScreen | null;
};

interface ScreenEditorProps {
	boardScreen: BoardScreen | null;
	onSave?: (updatedDisplays?: IScreen) => void;
}

type PanelTab = "objects" | "screen";

// Catalog categories for adding objects
const objectCatalog = [
	{
		category: "Stimuli",
		items: [
			{ label: "Image", templateType: "image" as const, icon: Image },
			{ label: "Audio", templateType: "audio" as const, icon: Volume2 },
			{ label: "Text", templateType: "text" as const, icon: Type },
		],
	},
];

// Screen-level component definitions
const componentDefs: {
	type: ScreenComponentType;
	label: string;
	description: string;
	icon: React.FC<{ size?: number; color?: string }>;
}[] = [
	{ type: "audio-rating", label: "Rating Scale", description: "MOS rating after audio", icon: Star },
	{ type: "text-highlighting", label: "Text Highlighting", description: "Highlight text interaction", icon: Edit3 },
	{ type: "eye-tracking", label: "Eye Tracking", description: "Enable gaze tracking", icon: Eye },
	{ type: "fixation-cross", label: "Fixation Cross", description: "Show fixation before content", icon: Crosshair },
	{ type: "calibration", label: "Calibration", description: "Eye tracking calibration", icon: Crosshair },
	{ type: "advance-continue", label: "Continue Button", description: "Button to advance", icon: SkipForward },
	{ type: "advance-time-limit", label: "Time Limit", description: "Auto-advance after duration", icon: Clock },
	{ type: "advance-audio-end", label: "Advance on Audio End", description: "Advance when audio finishes", icon: Headphones },
];

const ScreenEditor: React.FC<ScreenEditorProps> = ({ boardScreen, onSave: onSaveCallback }) => {
	const theme = useTheme();
	const { createModal } = useModal();
	const dispatch = useDispatch<StoreDispatch>();
	const { gridType, items, components } = useSelector(
		(state: StoreState) => state.createScreen
	);

	const [activeTab, setActiveTab] = useState<PanelTab>("objects");
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
	const [showCatalog, setShowCatalog] = useState(false);

	// Initialize Redux store from the existing screen data
	useEffect(() => {
		dispatch(createScreenActions.reset());
		if (boardScreen?.displays) {
			const screen = boardScreen.displays;
			if (screen.grid?.type) {
				dispatch(createScreenActions.setGridType(screen.grid.type));
			}
			if (screen.grid?.subtype) {
				dispatch(createScreenActions.setGridSubtype(screen.grid.subtype));
			}
			dispatch(createScreenActions.setEnableTracking(screen.enable_tracking ?? false));
			// Load existing items into the store
			for (const item of screen.items) {
				dispatch(createScreenActions.addItem(item));
			}
			// Load existing components into the store
			if (screen.components) {
				dispatch(createScreenActions.setComponents(screen.components));
			}
		}
	}, [boardScreen, dispatch]);

	const getGridSize = (size: string) => {
		switch (size) {
			case "1x1": return 1;
			case "2x2": return 2;
			case "3x3": return 3;
			default: return 3;
		}
	};

	const getGridIndex = (pos: ItemPosition): number => {
		const positionMap: Record<ItemPosition, number> = {
			UL: 0, UC: 1, UR: 2,
			CL: 3, C: 4, CR: 5,
			BL: 6, BC: 7, BR: 8,
		};
		return positionMap[pos];
	};

	const getAlignmentStyles = (align: ItemAlignment) => {
		const alignmentMap = {
			"top-left": { justifyContent: "flex-start", alignItems: "flex-start" },
			"top-center": { justifyContent: "center", alignItems: "flex-start" },
			"top-right": { justifyContent: "flex-end", alignItems: "flex-start" },
			"center-left": { justifyContent: "flex-start", alignItems: "center" },
			"center-center": { justifyContent: "center", alignItems: "center" },
			"center-right": { justifyContent: "flex-end", alignItems: "center" },
			"bottom-left": { justifyContent: "flex-start", alignItems: "flex-end" },
			"bottom-center": { justifyContent: "center", alignItems: "flex-end" },
			"bottom-right": { justifyContent: "flex-end", alignItems: "flex-end" },
		};
		return alignmentMap[align] || alignmentMap["center-center"];
	};

	const renderMedia = (media: IMedia | null) => {
		if (!media?.src) return null;

		if (media.type === "picture") {
			return (
				<img
					src={media.src}
					alt={media.filename}
					style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain", borderRadius: "4px" }}
				/>
			);
		}

		if (media.type === "audio") {
			return (
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px", gap: "4px" }}>
					<audio controls style={{ width: "100%", maxWidth: "150px", height: "30px" }}>
						<source src={media.src} />
					</audio>
					<div style={{ fontSize: "9px", textAlign: "center", wordBreak: "break-word" }}>{media.filename}</div>
				</div>
			);
		}

		return null;
	};

	const renderItemContent = (item: ScreenItem | null) => {
		if (!item) return null;

		if (item.type === "media" && item.media) return renderMedia(item.media);

		if (item.type === "text" && item.text) {
			return (
				<div style={{ padding: "8px", textAlign: "center", wordBreak: "break-word", fontSize: "14px", color: "#333" }}>
					{item.text}
				</div>
			);
		}

		if (item.type === "template") {
			// Show placeholder for template items
			const Icon = item.template_type === "audio" ? Volume2 : item.template_type === "image" ? Image : Type;
			return (
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", opacity: 0.5 }}>
					<Icon size={24} color={theme.main.placeholder} />
					<Typography variant="caption" textColor="placeholder">
						{item.template_type}
					</Typography>
				</div>
			);
		}

		if (item.type === "form" && item.form) {
			return (
				<div style={{
					padding: "8px", textAlign: "center", fontSize: "14px",
					color: theme.main.primary,
					border: `1px dashed ${theme.main.primary}`,
					borderRadius: "4px",
					backgroundColor: theme.main.primaryGhost,
				}}>
					Form: {typeof item.form === "string" ? item.form : item.form.alias}
				</div>
			);
		}

		return null;
	};

	const getIconForItem = (item: ScreenItem) => {
		if (item.template_type === "audio" || (item.type === "media" && item.media?.type === "audio")) return Volume2;
		if (item.template_type === "image" || (item.type === "media" && item.media?.type === "picture")) return Image;
		if (item.template_type === "text" || item.type === "text") return Type;
		return Edit3;
	};

	const getItemLabel = (item: ScreenItem) => {
		if (item.media?.filename) return item.media.filename;
		if (item.text) return item.text.slice(0, 30) + (item.text.length > 30 ? "..." : "");
		return item.template_type || item.type;
	};

	const openGridSettings = () => {
		createModal({
			id: ModalId.GridSettings,
			title: "Grid",
			children: <Modals.GridSettingsModal.Content />,
			width: ModalSizes.GridSettings,
		});
	};

	const handleAddObject = (templateType: "image" | "audio" | "text") => {
		const newItem: ScreenItem = {
			_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			type: "template",
			template_type: templateType,
			position: "center",
			area: "content",
			v_align: "center",
			h_align: "center",
		};
		dispatch(createScreenActions.addItem(newItem));
		setSelectedItemId(newItem._id);
		setShowCatalog(false);
	};

	const handleToggleComponent = (comp: ScreenComponent) => {
		const exists = components.some((c) => c.type === comp.type);
		if (exists) {
			dispatch(createScreenActions.removeComponent(comp.type));
		} else {
			dispatch(createScreenActions.addComponent(comp));
		}
	};

	const handleRemoveItem = (itemId: string) => {
		dispatch(createScreenActions.removeItem(itemId));
		if (selectedItemId === itemId) setSelectedItemId(null);
	};

	const onSave = () => {
		const updatedDisplays: IScreen | undefined = boardScreen?.displays
			? {
				...boardScreen.displays,
				grid: { type: gridType, subtype: boardScreen.displays.grid?.subtype ?? "equal" },
				items: [...items],
				components: [...components],
				enable_tracking: components.some((c) => c.type === "eye-tracking"),
			}
			: undefined;
		dispatch(createScreenActions.reset());
		onSaveCallback?.(updatedDisplays);
	};

	return (
		<S.Container>
			{/* Left: Canvas */}
			<S.CanvasPanel>
				<S.CanvasToolbar>
					<Badge size="large" onClick={() => onSaveCallback?.()} clickable variant="outlined">
						<ArrowLeft size={14} />
						&nbsp;Back
					</Badge>
					<Badge onClick={openGridSettings} size="medium" clickable variant="outlined">
						<FeatherGrid size={14} color={theme.main.primary} />
						&nbsp;Grid
					</Badge>
					<Badge size="large" onClick={onSave} clickable variant="outlined">
						Save
					</Badge>
				</S.CanvasToolbar>
				<S.CanvasArea>
					<Grid
						cols={getGridSize(gridType)}
						rows={getGridSize(gridType)}
						gap={{ col: 5, row: 5 }}
						width="100%"
						padding="0"
					>
						{Array.from({ length: getGridSize(gridType) ** 2 }).map((_, i) => {
							const item = items.find((itm) => {
								const pos = itm.position ? getItemPositionFromMap(itm.area!, itm.position) : null;
								return pos && getGridIndex(pos) === i;
							});
							const isSelected = item && selectedItemId === item._id;
							const isTargetable = !item && !!selectedItemId;
							const alignStyles = item?.v_align && item?.h_align
								? getAlignmentStyles(`${item.v_align}-${item.h_align}` as ItemAlignment)
								: {};

							const cellPositionMap: Record<GridType, ItemPosition[]> = {
								"1x1": ["C"],
								"2x2": ["UL", "UR", "BL", "BR"],
								"3x3": ["UL", "UC", "UR", "CL", "C", "CR", "BL", "BC", "BR"],
							};

							const handleCellClick = () => {
								if (item) {
									setSelectedItemId(item._id);
								} else if (selectedItemId) {
									const targetPos = cellPositionMap[gridType as GridType]?.[i];
									if (targetPos) {
										const { area, position } = getPositionsMap(targetPos);
										dispatch(createScreenActions.updateItem({ _id: selectedItemId, area, position }));
									}
								}
							};

							return (
								<S.GridCell key={i}>
									<Box bgColor="default" textColor="darker" centered borderRadius="12px" height="100%">
										<S.GridItem
											$selected={isSelected}
											onClick={handleCellClick}
											style={{
												...alignStyles,
												cursor: isTargetable ? "copy" : item ? "pointer" : "default",
												outline: isTargetable ? "2px dashed #aaa" : undefined,
											}}
										>
											{item && renderItemContent(item)}
											{isTargetable && (
												<div style={{ opacity: 0.3, fontSize: 24 }}>+</div>
											)}
										</S.GridItem>
									</Box>
								</S.GridCell>
							);
						})}
					</Grid>
				</S.CanvasArea>
			</S.CanvasPanel>

			{/* Right: Panel */}
			<S.RightPanel>
				<S.PanelTabs>
					<S.PanelTab $active={activeTab === "objects"} onClick={() => setActiveTab("objects")}>
						Objects
					</S.PanelTab>
					<S.PanelTab $active={activeTab === "screen"} onClick={() => setActiveTab("screen")}>
						Screen
					</S.PanelTab>
				</S.PanelTabs>

				<S.PanelContent>
					{activeTab === "objects" && (
						<>
							{items.length === 0 && (
								<Typography variant="caption" textColor="placeholder">
									No objects yet. Add objects to build your screen.
								</Typography>
							)}
							{items.map((item) => {
								const Icon = getIconForItem(item);
								return (
									<S.ObjectItem
										key={item._id}
										$selected={selectedItemId === item._id}
										onClick={() => setSelectedItemId(item._id)}
									>
										<S.ObjectIcon>
											<Icon size={16} color={theme.main.textOne} />
										</S.ObjectIcon>
										<div style={{ flex: 1, minWidth: 0 }}>
											<Typography variant="body-2" textColor="textOne">
												{getItemLabel(item)}
											</Typography>
											<Typography variant="caption" textColor="placeholder">
												{item.area} / {item.position}
											</Typography>
										</div>
										<Trash2
											size={14}
											color={theme.main.placeholder}
											style={{ cursor: "pointer", flexShrink: 0 }}
											onClick={(e) => {
												e.stopPropagation();
												handleRemoveItem(item._id);
											}}
										/>
									</S.ObjectItem>
								);
							})}
							<S.AddButton onClick={() => setShowCatalog(true)}>
								<PlusCircle size={14} />
								Add Object
							</S.AddButton>
						</>
					)}

					{activeTab === "screen" && (
						<>
							<S.SectionLabel>
								<Typography variant="caption" textColor="placeholder">
									Components
								</Typography>
							</S.SectionLabel>
							{componentDefs.map((def) => {
								const isActive = components.some((c) => c.type === def.type);
								const Icon = def.icon;
								return (
									<S.ComponentToggle
										key={def.type}
										$active={isActive}
										onClick={() => handleToggleComponent({ type: def.type })}
									>
										<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
											<Icon size={16} color={isActive ? theme.main.primary : theme.main.placeholder} />
											<div>
												<Typography variant="body-2" textColor={isActive ? "primary" : "textOne"}>
													{def.label}
												</Typography>
												<Typography variant="caption" textColor="placeholder">
													{def.description}
												</Typography>
											</div>
										</div>
										<S.ToggleDot $active={isActive} />
									</S.ComponentToggle>
								);
							})}
						</>
					)}
				</S.PanelContent>
			</S.RightPanel>

			{/* Object Catalog overlay */}
			{showCatalog && (
				<S.CatalogOverlay onClick={() => setShowCatalog(false)}>
					<S.CatalogPanel onClick={(e) => e.stopPropagation()}>
						<S.CatalogHeader>
							<Typography variant="h6" textColor="textOne">
								Add Object
							</Typography>
							<Badge size="small" clickable onClick={() => setShowCatalog(false)}>
								Close
							</Badge>
						</S.CatalogHeader>
						{objectCatalog.map((section) => (
							<S.CatalogSection key={section.category}>
								<Typography variant="caption" textColor="placeholder">
									{section.category}
								</Typography>
								{section.items.map((catItem) => {
									const Icon = catItem.icon;
									return (
										<S.CatalogItem
											key={catItem.templateType}
											onClick={() => handleAddObject(catItem.templateType)}
										>
											<S.ObjectIcon>
												<Icon size={18} color={theme.main.primary} />
											</S.ObjectIcon>
											<Typography variant="body-2" textColor="textOne">
												{catItem.label}
											</Typography>
										</S.CatalogItem>
									);
								})}
							</S.CatalogSection>
						))}
					</S.CatalogPanel>
				</S.CatalogOverlay>
			)}
		</S.Container>
	);
};

export default ScreenEditor;
