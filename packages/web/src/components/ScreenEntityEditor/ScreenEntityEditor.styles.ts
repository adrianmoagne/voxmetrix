import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/react";

// --- Animations ---

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
	from { opacity: 0; transform: scale(0.96); }
	to { opacity: 1; transform: scale(1); }
`;

const pulseGlow = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 rgba(93, 105, 217, 0); }
	50% { box-shadow: 0 0 0 4px rgba(93, 105, 217, 0.12); }
`;

// --- Entity type color system ---

export const entityColors: Record<string, { bg: string; fg: string; border: string }> = {
	AudioPlayer: { bg: "#e8f0fb", fg: "#2d6bc4", border: "#4a90d9" },
	Image: { bg: "#e4f5ef", fg: "#2a8f6e", border: "#5bc0a0" },
	Text: { bg: "#eee8f8", fg: "#6b5b95", border: "#9b8ec4" },
	RatingScale: { bg: "#fdf3e2", fg: "#b07d2a", border: "#e8a742" },
	TextHighlighter: { bg: "#fce8ed", fg: "#b03a55", border: "#d4637c" },
	ContinueButton: { bg: "#eef0f2", fg: "#556270", border: "#7c8a96" },
};

// --- Layout ---

const Container = styled.div`
	display: flex;
	flex-direction: row;
	height: 100%;
	width: 100%;
	gap: 0;
	border-radius: 10px;
	overflow: hidden;
	background: ${({ theme }) => theme.main.backgroundOne};
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(0, 0, 0, 0.04);
	font-family: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;
`;

// --- Canvas (left panel) ---

const CanvasPanel = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
	background: ${({ theme }) => theme.main.backgroundTwo};
`;

const CanvasToolbar = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 10px 16px;
	gap: 10px;
	background: ${({ theme }) => theme.main.backgroundOne};
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
`;

const CanvasArea = styled.div`
	display: flex;
	flex: 1;
	min-height: 0;
	overflow: hidden;
	padding: 20px;
	background: radial-gradient(circle, ${({ theme }) => theme.main.backgroundThree} 0.7px, transparent 0.7px);
	background-size: 20px 20px;
	background-color: ${({ theme }) => theme.main.backgroundTwo};
`;

// --- Right panel ---

const RightPanel = styled.div`
	display: flex;
	flex-direction: column;
	width: 296px;
	min-width: 296px;
	background: ${({ theme }) => theme.main.backgroundOne};
	border-left: 1px solid ${({ theme }) => theme.main.border};
`;

const PanelTabs = styled.div`
	display: flex;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
`;

const PanelTab = styled.button<{ $active: boolean }>`
	flex: 1;
	padding: 11px 8px;
	border: none;
	background: ${({ $active, theme }) => ($active ? theme.main.backgroundOne : theme.main.backgroundTwo)};
	color: ${({ $active, theme }) => ($active ? theme.main.textOne : theme.main.textThree)};
	font-family: "DM Sans", sans-serif;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	cursor: pointer;
	position: relative;
	transition: all 0.2s ease;

	&::after {
		content: "";
		position: absolute;
		bottom: 0;
		left: 16px;
		right: 16px;
		height: 2px;
		background: ${({ $active, theme }) => ($active ? theme.main.primary : "transparent")};
		border-radius: 2px 2px 0 0;
		transition: background 0.2s ease;
	}

	&:hover {
		color: ${({ $active, theme }) => ($active ? theme.main.textOne : theme.main.textTwo)};
	}
`;

const PanelContent = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 14px;
	display: flex;
	flex-direction: column;
	gap: 6px;

	scrollbar-width: thin;
	scrollbar-color: ${({ theme }) => theme.main.border} transparent;

	&::-webkit-scrollbar {
		width: 4px;
	}
	&::-webkit-scrollbar-thumb {
		background: ${({ theme }) => theme.main.border};
		border-radius: 4px;
	}
`;

// --- Entity list items ---

const ObjectItem = styled.div<{ $selected?: boolean }>`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 10px;
	border-radius: 8px;
	cursor: pointer;
	border: 1px solid ${({ $selected, theme }) => ($selected ? theme.main.primary : theme.main.border)};
	background: ${({ $selected, theme }) => ($selected ? theme.main.primaryGhost : theme.main.backgroundOne)};
	transition: all 0.15s ease;
	animation: ${fadeIn} 0.2s ease;

	&:hover {
		border-color: ${({ $selected, theme }) => ($selected ? theme.main.primary : theme.main.default)};
		background: ${({ $selected, theme }) => ($selected ? theme.main.primaryGhost : theme.main.backgroundTwo)};
	}
`;

const ObjectIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	border-radius: 6px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border: 1px solid ${({ theme }) => theme.main.border};
	flex-shrink: 0;
`;

// --- Behavior toggles ---

const ComponentToggle = styled.div<{ $active: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	border-radius: 8px;
	cursor: pointer;
	border: 1px solid ${({ $active, theme }) => ($active ? theme.main.default : theme.main.border)};
	background: ${({ $active, theme }) => ($active ? theme.main.backgroundTwo : theme.main.backgroundOne)};
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.default};
		background: ${({ theme }) => theme.main.backgroundTwo};
	}
`;

const ToggleDot = styled.div<{ $active: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ $active, theme }) => ($active ? theme.main.success : theme.main.border)};
	box-shadow: ${({ $active, theme }) => ($active ? `0 0 6px ${theme.main.successGhost}` : "none")};
	transition: all 0.2s ease;
`;

const SectionLabel = styled.div`
	padding: 4px 0;
	margin-top: 4px;
`;

const AddButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	padding: 10px;
	border: 1px dashed ${({ theme }) => theme.main.border};
	border-radius: 8px;
	background: transparent;
	color: ${({ theme }) => theme.main.primary};
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background: ${({ theme }) => theme.main.primaryGhost};
	}
`;

// --- Grid cells ---

const GridCell = styled.div`
	min-height: 80px;
	height: 100%;
`;

const GridItem = styled.div<{ $selected?: boolean }>`
	display: flex;
	width: 100%;
	height: 100%;
	background: ${({ theme }) => theme.main.backgroundOne};
	border-radius: 10px;
	border: 2px solid ${({ $selected, theme }) => ($selected ? theme.main.primary : theme.main.border)};
	cursor: pointer;
	transition: all 0.15s ease;
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.03);

	${({ $selected }) =>
		$selected &&
		css`
			animation: ${pulseGlow} 2s ease infinite;
		`}

	&:hover {
		border-color: ${({ $selected, theme }) => ($selected ? theme.main.primary : theme.main.default)};
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 8px rgba(0, 0, 0, 0.05);
	}
`;

// --- Catalog overlay ---

const CatalogOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(27, 33, 64, 0.2);
	backdrop-filter: blur(3px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
`;

const CatalogPanel = styled.div`
	background: ${({ theme }) => theme.main.backgroundOne};
	border-radius: 14px;
	width: 380px;
	max-height: 500px;
	overflow-y: auto;
	border: 1px solid ${({ theme }) => theme.main.border};
	box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.03);
	animation: ${scaleIn} 0.2s ease;
`;

const CatalogHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18px 20px 14px;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
`;

const CatalogSection = styled.div`
	padding: 10px 16px;
`;

const CatalogItem = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 12px;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.15s ease;
	color: ${({ theme }) => theme.main.textOne};

	&:hover {
		background: ${({ theme }) => theme.main.backgroundTwo};
	}
`;

// --- Properties panel ---

const PropertySection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 10px 0;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};

	&:last-child {
		border-bottom: none;
	}
`;

const PropertyLabel = styled.label`
	font-family: "IBM Plex Mono", "SF Mono", monospace;
	font-size: 10px;
	font-weight: 500;
	color: ${({ theme }) => theme.main.placeholder};
	text-transform: uppercase;
	letter-spacing: 0.8px;
`;

const BoundFieldWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	animation: ${fadeIn} 0.15s ease;
`;

const BoundFieldRow = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
`;

const BindingToggle = styled.button<{ $active: boolean }>`
	padding: 2px 7px;
	border-radius: 4px;
	border: 1px solid ${({ $active, theme }) => ($active ? entityColors.AudioPlayer.border : theme.main.border)};
	background: ${({ $active }) => ($active ? entityColors.AudioPlayer.bg : "transparent")};
	color: ${({ $active, theme }) => ($active ? entityColors.AudioPlayer.fg : theme.main.placeholder)};
	font-family: "IBM Plex Mono", monospace;
	font-size: 9px;
	font-weight: 600;
	cursor: pointer;
	white-space: nowrap;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ $active, theme }) => ($active ? entityColors.AudioPlayer.fg : theme.main.default)};
		color: ${({ $active, theme }) => ($active ? entityColors.AudioPlayer.fg : theme.main.textTwo)};
	}
`;

// --- Position grid ---

const PositionGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: repeat(3, 1fr);
	gap: 3px;
	width: 78px;
	height: 78px;
	padding: 4px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-radius: 8px;
	border: 1px solid ${({ theme }) => theme.main.border};
`;

const PositionDot = styled.button<{ $active: boolean; $available: boolean }>`
	width: 100%;
	aspect-ratio: 1;
	border-radius: 4px;
	border: none;
	background: ${({ $active, $available, theme }) =>
		$active ? theme.main.primary : $available ? theme.main.backgroundOne : theme.main.backgroundTwo};
	cursor: ${({ $available }) => ($available ? "pointer" : "default")};
	transition: all 0.15s ease;
	padding: 0;
	box-shadow: ${({ $available, $active, theme }) =>
		$active
			? `0 0 8px ${theme.main.primaryGhost}`
			: $available
			? `inset 0 1px 2px rgba(0,0,0,0.04)`
			: "none"};

	&:hover {
		${({ $available, $active, theme }) =>
			$available &&
			!$active &&
			`background: ${theme.main.backgroundThree}; box-shadow: inset 0 1px 2px rgba(0,0,0,0.06);`}
	}
`;

// --- Entity preview in canvas cells ---

const StackIndicator = styled.div`
	position: absolute;
	top: 6px;
	right: 6px;
	min-width: 18px;
	height: 18px;
	padding: 0 5px;
	border-radius: 9px;
	background: ${({ theme }) => theme.main.textOne};
	color: ${({ theme }) => theme.main.white};
	font-family: "IBM Plex Mono", monospace;
	font-size: 10px;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
`;

const EntityPreview = styled.div<{ $selected?: boolean; $kind?: string }>`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 5px 8px;
	border-radius: 6px;
	font-size: 11px;
	font-weight: 500;
	color: ${({ $kind }) => entityColors[$kind ?? ""]?.fg ?? "#556270"};
	background: ${({ $kind }) => entityColors[$kind ?? ""]?.bg ?? "#f0f0ee"};
	border-left: 3px solid ${({ $kind }) => entityColors[$kind ?? ""]?.border ?? "#999"};
	cursor: pointer;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	transition: all 0.15s ease;

	${({ $selected, theme }) =>
		$selected &&
		css`
			outline: 2px solid ${theme.main.primary};
			outline-offset: 1px;
		`}

	&:hover {
		filter: brightness(0.97);
	}
`;

// --- Form inputs ---

const FieldInput = styled.input`
	width: 100%;
	padding: 7px 10px;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 6px;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	background: ${({ theme }) => theme.main.backgroundOne};
	color: ${({ theme }) => theme.main.textOne};
	outline: none;
	transition: border-color 0.15s ease;

	&::placeholder {
		color: ${({ theme }) => theme.main.placeholder};
	}

	&:focus {
		border-color: ${({ theme }) => theme.main.primary};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.main.primaryGhost};
	}
`;

const FieldSelect = styled.select`
	width: 100%;
	padding: 7px 10px;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 6px;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	background: ${({ theme }) => theme.main.backgroundOne};
	color: ${({ theme }) => theme.main.textOne};
	outline: none;
	cursor: pointer;
	appearance: none;
	background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23989BA7' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: right 10px center;
	padding-right: 28px;

	&:focus {
		border-color: ${({ theme }) => theme.main.primary};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.main.primaryGhost};
	}
`;

const PhaseBadge = styled.span<{ $phase: string }>`
	padding: 1px 6px;
	border-radius: 3px;
	font-family: "IBM Plex Mono", monospace;
	font-size: 9px;
	font-weight: 600;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	background: ${({ $phase }) =>
		$phase === "stimulus"
			? entityColors.AudioPlayer.bg
			: $phase === "response"
			? entityColors.Image.bg
			: $phase === "ready"
			? entityColors.ContinueButton.bg
			: entityColors.Text.bg};
	color: ${({ $phase }) =>
		$phase === "stimulus"
			? entityColors.AudioPlayer.fg
			: $phase === "response"
			? entityColors.Image.fg
			: $phase === "ready"
			? entityColors.ContinueButton.fg
			: entityColors.Text.fg};
`;

// --- Toolbar ---

const ToolbarInput = styled.input`
	padding: 6px 10px;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 6px;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	font-weight: 500;
	background: ${({ theme }) => theme.main.backgroundOne};
	color: ${({ theme }) => theme.main.textOne};
	outline: none;
	transition: border-color 0.15s ease;

	&::placeholder {
		color: ${({ theme }) => theme.main.placeholder};
	}

	&:focus {
		border-color: ${({ theme }) => theme.main.primary};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.main.primaryGhost};
	}
`;

const GridTypePill = styled.button<{ $active: boolean }>`
	padding: 5px 12px;
	border: 1px solid ${({ $active, theme }) => ($active ? theme.main.primary : theme.main.border)};
	border-radius: 6px;
	background: ${({ $active, theme }) => ($active ? theme.main.primary : theme.main.backgroundOne)};
	color: ${({ $active, theme }) => ($active ? theme.main.white : theme.main.textThree)};
	font-family: "IBM Plex Mono", monospace;
	font-size: 11px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		${({ $active, theme }) => !$active && `color: ${theme.main.primary};`}
	}
`;

const ToolbarButton = styled.button<{ $variant?: "primary" | "ghost" }>`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 14px;
	border-radius: 6px;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s ease;
	background: ${({ $variant, theme }) => ($variant === "primary" ? theme.main.primary : theme.main.backgroundOne)};
	border: ${({ $variant, theme }) => ($variant === "primary" ? "none" : `1px solid ${theme.main.border}`)};
	color: ${({ $variant, theme }) => ($variant === "primary" ? theme.main.white : theme.main.textTwo)};

	&:hover {
		background: ${({ $variant, theme }) => ($variant === "primary" ? theme.main.tertiary : theme.main.backgroundTwo)};
		border-color: ${({ $variant, theme }) => ($variant === "primary" ? "none" : theme.main.default)};
		color: ${({ $variant, theme }) => ($variant === "primary" ? theme.main.white : theme.main.textOne)};
	}
`;

// --- Preview overlay ---

const PreviewOverlay = styled.div`
	position: fixed;
	inset: 0;
	background: ${({ theme }) => theme.main.backgroundTwo};
	z-index: 100;
	display: flex;
	flex-direction: column;
	animation: ${fadeIn} 0.2s ease;
`;

const PreviewBar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 20px;
	background: ${({ theme }) => theme.main.backgroundOne};
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	flex-shrink: 0;
	gap: 12px;
`;

const PreviewLabel = styled.span`
	font-family: "IBM Plex Mono", monospace;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 1px;
	color: ${({ theme }) => theme.main.placeholder};
`;

const PreviewScreenArea = styled.div`
	flex: 1;
	min-height: 0;
	position: relative;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	overflow-x: hidden;
	background: ${({ theme }) => theme.main.backgroundOne};

	> * {
		width: 100%;
		min-height: 100%;
		display: flex;
		flex-direction: column;
	}
`;

const PreviewComplete = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	gap: 16px;
	color: ${({ theme }) => theme.main.textTwo};
	font-family: "DM Sans", sans-serif;
	font-size: 15px;
`;

const S = {
	Container,
	CanvasPanel,
	CanvasToolbar,
	CanvasArea,
	RightPanel,
	PanelTabs,
	PanelTab,
	PanelContent,
	ObjectItem,
	ObjectIcon,
	ComponentToggle,
	ToggleDot,
	SectionLabel,
	AddButton,
	GridCell,
	GridItem,
	CatalogOverlay,
	CatalogPanel,
	CatalogHeader,
	CatalogSection,
	CatalogItem,
	PropertySection,
	PropertyLabel,
	BoundFieldWrapper,
	BoundFieldRow,
	BindingToggle,
	PositionGrid,
	PositionDot,
	StackIndicator,
	EntityPreview,
	FieldInput,
	FieldSelect,
	PhaseBadge,
	ToolbarInput,
	GridTypePill,
	ToolbarButton,
	PreviewOverlay,
	PreviewBar,
	PreviewLabel,
	PreviewScreenArea,
	PreviewComplete,
};

export default S;
