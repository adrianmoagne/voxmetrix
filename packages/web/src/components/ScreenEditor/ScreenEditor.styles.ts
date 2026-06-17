import styled from "@emotion/styled";

const Container = styled.div`
	display: flex;
	flex-direction: row;
	height: 100%;
	width: 100%;
	gap: 0;
	border-radius: 12px;
	border: 1px solid ${({ theme }) => theme.main.border};
	overflow: hidden;
`;

const CanvasPanel = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
	border-right: 1px solid ${({ theme }) => theme.main.border};
`;

const CanvasToolbar = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 8px 12px;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	gap: 8px;
`;

const CanvasArea = styled.div`
	display: flex;
	flex: 1;
	min-height: 0;
	overflow: hidden;
	padding: 12px;
`;

const RightPanel = styled.div`
	display: flex;
	flex-direction: column;
	width: 280px;
	min-width: 280px;
	background: ${({ theme }) => theme.main.backgroundOne};
`;

const PanelTabs = styled.div`
	display: flex;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
`;

const PanelTab = styled.button<{ $active: boolean }>`
	flex: 1;
	padding: 10px 12px;
	border: none;
	background: ${({ $active, theme }) =>
		$active ? theme.main.backgroundOne : theme.main.backgroundTwo};
	color: ${({ $active, theme }) =>
		$active ? theme.main.primary : theme.main.placeholder};
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	border-bottom: 2px solid
		${({ $active, theme }) => ($active ? theme.main.primary : "transparent")};
	transition: all 0.15s ease;

	&:hover {
		color: ${({ theme }) => theme.main.primary};
	}
`;

const PanelContent = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const ObjectItem = styled.div<{ $selected?: boolean }>`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 10px;
	border-radius: 8px;
	cursor: pointer;
	border: 1px solid
		${({ $selected, theme }) =>
			$selected ? theme.main.primary : theme.main.border};
	background: ${({ $selected, theme }) =>
		$selected ? theme.main.primaryGhost : theme.main.backgroundTwo};
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background: ${({ theme }) => theme.main.primaryGhost};
	}
`;

const ObjectIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 6px;
	background: ${({ theme }) => theme.main.backgroundThree};
	flex-shrink: 0;
`;

const ComponentToggle = styled.div<{ $active: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	border-radius: 8px;
	cursor: pointer;
	border: 1px solid
		${({ $active, theme }) =>
			$active ? theme.main.primary : theme.main.border};
	background: ${({ $active, theme }) =>
		$active ? theme.main.primaryGhost : theme.main.backgroundTwo};
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
	}
`;

const ToggleDot = styled.div<{ $active: boolean }>`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: ${({ $active, theme }) =>
		$active ? theme.main.primary : theme.main.border};
	transition: background 0.15s ease;
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
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background: ${({ theme }) => theme.main.primaryGhost};
	}
`;

const GridCell = styled.div`
	min-height: 0;
	height: 100%;
`;

const GridItem = styled.div<{ $selected?: boolean }>`
	display: flex;
	width: 100%;
	height: 100%;
	background-color: ${({ theme }) => theme.main.backgroundTwo};
	border-radius: 10px;
	border: 2px solid
		${({ $selected, theme }) =>
			$selected ? theme.main.primary : "transparent"};
	cursor: pointer;
	transition: border-color 0.15s ease;

	&:hover {
		background-color: ${({ theme }) => theme.main.backgroundThree};
		border-color: ${({ theme }) => theme.main.primaryGhost};
	}
`;

const CatalogOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
`;

const CatalogPanel = styled.div`
	background: ${({ theme }) => theme.main.backgroundOne};
	border-radius: 12px;
	width: 400px;
	max-height: 500px;
	overflow-y: auto;
	border: 1px solid ${({ theme }) => theme.main.border};
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
`;

const CatalogHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
`;

const CatalogSection = styled.div`
	padding: 12px 16px;
`;

const CatalogItem = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 12px;
	border-radius: 8px;
	cursor: pointer;
	transition: background 0.15s ease;

	&:hover {
		background: ${({ theme }) => theme.main.primaryGhost};
	}
`;

export default {
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
};
