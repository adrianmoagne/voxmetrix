import styled from "@emotion/styled";

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
`;

const Toolbar = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 18px;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
`;

const FilterButton = styled.button<{ $active?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 6px;
	border: 1px solid
		${({ theme, $active }) => ($active ? theme.main.primary : theme.main.border)};
	background: ${({ theme, $active }) =>
		$active ? theme.main.primaryGhost : "transparent"};
	color: ${({ theme, $active }) => ($active ? theme.main.primary : theme.main.textOne)};
	font-size: 13px;
	cursor: pointer;
`;

const BlockPicker = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: ${({ theme }) => theme.main.placeholder};
`;

const BlockSelect = styled.select`
	padding: 5px 8px;
	border-radius: 6px;
	border: 1px solid ${({ theme }) => theme.main.border};
	background: ${({ theme }) => theme.main.backgroundOne};
	color: ${({ theme }) => theme.main.textOne};
	font-size: 13px;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.main.primary};
	}
`;

const Grid = styled.div`
	display: flex;
	padding: 18px;
	align-items: flex-start;
	align-content: flex-start;
	gap: 14px;
	flex-wrap: wrap;
	min-height: 360px;
	max-height: 420px;
	overflow-y: auto;
`;

const Card = styled.div<{ $selected?: boolean }>`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	width: 150px;
	height: 120px;
	padding: 12px;
	border-radius: 8px;
	cursor: pointer;
	border: 2px solid
		${({ theme, $selected }) => ($selected ? theme.main.primary : theme.main.border)};
	background: ${({ theme, $selected }) =>
		$selected ? theme.main.primaryGhost : theme.main.backgroundOne};
	transition: border-color 0.15s ease, background 0.15s ease;

	.icon {
		color: ${({ theme }) => theme.main.placeholder};
	}
`;

const Badge = styled.span`
	position: absolute;
	top: 6px;
	right: 6px;
	min-width: 20px;
	height: 20px;
	padding: 0 6px;
	border-radius: 10px;
	background: ${({ theme }) => theme.main.primary};
	color: #fff;
	font-size: 12px;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	justify-content: center;
`;

const FileName = styled.span`
	max-width: 130px;
	font-size: 12px;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: ${({ theme }) => theme.main.textOne};
`;

const Empty = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 360px;
	color: ${({ theme }) => theme.main.placeholder};
`;

const Footer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 18px;
	border-top: 1px solid ${({ theme }) => theme.main.border};
`;

const FooterActions = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

export default {
	Wrapper,
	Toolbar,
	FilterButton,
	BlockPicker,
	BlockSelect,
	Grid,
	Card,
	Badge,
	FileName,
	Empty,
	Footer,
	FooterActions,
};
