import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/react";

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to { opacity: 1; transform: translateY(0); }
`;

const Wrapper = styled.div`
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	background: ${({ theme }) => theme.main.backgroundOne};
	animation: ${fadeIn} 0.2s ease;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px 20px;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	flex-shrink: 0;
`;

const Title = styled.div`
	font-family: "IBM Plex Mono", monospace;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.6px;
	color: ${({ theme }) => theme.main.textTwo};
`;

const Count = styled.div`
	font-family: "IBM Plex Mono", monospace;
	font-size: 10px;
	color: ${({ theme }) => theme.main.placeholder};
	margin-left: auto;
`;

const TableScroll = styled.div`
	flex: 1;
	min-height: 0;
	overflow: auto;

	scrollbar-width: thin;
	scrollbar-color: ${({ theme }) => theme.main.border} transparent;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
`;

const Th = styled.th<{ $sticky?: boolean }>`
	position: sticky;
	top: 0;
	z-index: 2;
	padding: 8px 12px;
	text-align: left;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	border-right: 1px solid ${({ theme }) => theme.main.border};
	font-family: "IBM Plex Mono", monospace;
	font-size: 11px;
	font-weight: 600;
	color: ${({ theme }) => theme.main.textTwo};
	white-space: nowrap;
	min-width: ${({ $sticky }) => ($sticky ? "60px" : "160px")};

	${({ $sticky }) =>
		$sticky &&
		css`
			position: sticky;
			left: 0;
			z-index: 3;
		`}

	&:hover button.col-delete,
	&:hover button.col-fill {
		opacity: 1;
	}
`;

const ThContent = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
`;

const ColKeyInput = styled.input`
	border: none;
	outline: none;
	background: transparent;
	font-family: "IBM Plex Mono", monospace;
	font-size: 11px;
	font-weight: 600;
	color: ${({ theme }) => theme.main.textOne};
	padding: 0;
	width: 100%;
	min-width: 60px;
`;

const ColDeleteBtn = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	border: none;
	background: transparent;
	color: ${({ theme }) => theme.main.placeholder};
	cursor: pointer;
	padding: 0;
	opacity: 0;
	flex-shrink: 0;
	transition: all 0.12s ease;

	&:hover {
		background: ${({ theme }) => theme.main.dangerGhost};
		color: ${({ theme }) => theme.main.danger};
	}
`;

const ColFillBtn = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	border-radius: 4px;
	border: none;
	background: transparent;
	color: ${({ theme }) => theme.main.placeholder};
	cursor: pointer;
	padding: 0;
	opacity: 0;
	flex-shrink: 0;
	transition: all 0.12s ease;

	&:hover {
		background: ${({ theme }) => theme.main.primaryGhost};
		color: ${({ theme }) => theme.main.primary};
	}
`;

const AddColTh = styled.th`
	position: sticky;
	top: 0;
	z-index: 2;
	padding: 4px 8px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	width: 40px;
`;

const AddColBtn = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 4px;
	border: 1px dashed ${({ theme }) => theme.main.border};
	background: transparent;
	color: ${({ theme }) => theme.main.primary};
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background: ${({ theme }) => theme.main.primaryGhost};
	}
`;

const BlockCellLabel = styled.div`
	padding: 8px 12px;
	font-family: "DM Sans", sans-serif;
	font-size: 12px;
	font-weight: 500;
	color: ${({ theme }) => theme.main.primary};
	white-space: nowrap;
`;

const Td = styled.td<{ $sticky?: boolean }>`
	padding: 0;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	border-right: 1px solid ${({ theme }) => theme.main.border};
	background: ${({ theme }) => theme.main.backgroundOne};
	vertical-align: middle;

	${({ $sticky, theme }) =>
		$sticky &&
		css`
			position: sticky;
			left: 0;
			z-index: 1;
			background: ${theme.main.backgroundTwo};
			font-family: "IBM Plex Mono", monospace;
			font-size: 11px;
			color: ${theme.main.placeholder};
			text-align: center;
			padding: 0 8px;
		`}

	&:hover button.row-delete {
		opacity: 1;
	}
`;

const CellInput = styled.input`
	width: 100%;
	padding: 8px 12px;
	border: none;
	outline: none;
	background: transparent;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	color: ${({ theme }) => theme.main.textOne};

	&::placeholder {
		color: ${({ theme }) => theme.main.default};
	}

	&:focus {
		background: ${({ theme }) => theme.main.primaryGhost};
	}
`;

const RowDeleteBtn = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 4px;
	border: none;
	background: transparent;
	color: ${({ theme }) => theme.main.placeholder};
	cursor: pointer;
	padding: 0;
	opacity: 0;
	transition: all 0.12s ease;
	margin: 0 auto;

	&:hover {
		background: ${({ theme }) => theme.main.dangerGhost};
		color: ${({ theme }) => theme.main.danger};
	}
`;

const ActionTd = styled.td`
	padding: 0 8px;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	width: 108px;
	text-align: center;
	background: ${({ theme }) => theme.main.backgroundOne};

	&:hover button.row-delete,
	&:hover button.row-action {
		opacity: 1;
	}
`;

const RowActions = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 2px;
`;

const RowActionBtn = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 4px;
	border: none;
	background: transparent;
	color: ${({ theme }) => theme.main.placeholder};
	cursor: pointer;
	padding: 0;
	opacity: 0;
	transition: all 0.12s ease;

	&:hover:not(:disabled) {
		background: ${({ theme }) => theme.main.primaryGhost};
		color: ${({ theme }) => theme.main.primary};
	}

	&:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}
`;

const BlockSelect = styled.select`
	width: 100%;
	min-width: 120px;
	padding: 4px 6px;
	border: 1px solid transparent;
	border-radius: 4px;
	background: transparent;
	font-family: "DM Sans", sans-serif;
	font-size: 12px;
	color: ${({ theme }) => theme.main.textOne};
	cursor: pointer;

	&:hover,
	&:focus {
		border-color: ${({ theme }) => theme.main.border};
		background: ${({ theme }) => theme.main.backgroundTwo};
		outline: none;
	}
`;

const AddTrialRow = styled.tr``;

const AddTrialCell = styled.td`
	padding: 6px 12px;
	border-bottom: 2px solid ${({ theme }) => theme.main.border};
`;

const AddTrialBtn = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: 4px;
	border: 1px dashed ${({ theme }) => theme.main.border};
	background: transparent;
	font-family: "DM Sans", sans-serif;
	font-size: 11px;
	color: ${({ theme }) => theme.main.primary};
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background: ${({ theme }) => theme.main.primaryGhost};
	}
`;

const NewColInput = styled.input`
	padding: 6px 10px;
	border: 1px solid ${({ theme }) => theme.main.primary};
	border-radius: 4px;
	font-family: "IBM Plex Mono", monospace;
	font-size: 11px;
	color: ${({ theme }) => theme.main.textOne};
	background: ${({ theme }) => theme.main.backgroundOne};
	outline: none;
	width: 120px;
	box-shadow: 0 0 0 2px ${({ theme }) => theme.main.primaryGhost};
`;

const ShuffleControls = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-left: 16px;
	padding-left: 16px;
	border-left: 1px solid ${({ theme }) => theme.main.border};
`;

const ShuffleLabel = styled.label`
	font-family: "IBM Plex Mono", monospace;
	font-size: 10px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	color: ${({ theme }) => theme.main.textTwo};
`;

const ShuffleSelect = styled.select`
	padding: 4px 8px;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 4px;
	background: ${({ theme }) => theme.main.backgroundOne};
	font-family: "DM Sans", sans-serif;
	font-size: 12px;
	color: ${({ theme }) => theme.main.textOne};
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.main.primary};
	}
`;

const ShuffleHint = styled.span`
	font-family: "DM Sans", sans-serif;
	font-size: 11px;
	color: ${({ theme }) => theme.main.placeholder};
	max-width: 280px;
`;

const MetaCell = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4px 8px;
	min-height: 36px;
`;

const GroupInput = styled.input<{ $disabled?: boolean }>`
	width: 100%;
	padding: 6px 8px;
	border: none;
	outline: none;
	background: transparent;
	font-family: "IBM Plex Mono", monospace;
	font-size: 11px;
	color: ${({ theme }) => theme.main.textOne};
	opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
	cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "text")};

	&::placeholder {
		color: ${({ theme }) => theme.main.default};
	}

	&:focus {
		background: ${({ theme, $disabled }) => ($disabled ? "transparent" : theme.main.primaryGhost)};
	}
`;

export default {
	Wrapper, Header, Title, Count,
	ShuffleControls, ShuffleLabel, ShuffleSelect, ShuffleHint,
	TableScroll, Table, Th, ThContent,
	ColKeyInput, ColDeleteBtn, ColFillBtn, AddColTh, AddColBtn,
	BlockCellLabel, BlockSelect, Td, CellInput, RowDeleteBtn, RowActionBtn, RowActions, MetaCell, GroupInput,
	ActionTd, AddTrialRow, AddTrialCell, AddTrialBtn, NewColInput,
};
