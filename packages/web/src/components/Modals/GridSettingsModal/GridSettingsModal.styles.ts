import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 12px;
	height: 407px;
`;

const Row = styled.div`
	display: flex;
	flex-direction: row;
	gap: 12px;
`;

const SelectableButton = styled.button<{ $selected: boolean }>`
	border: 1px solid
		${({ theme, $selected }) => ($selected ? theme.main.primary : theme.main.border)};
	border-radius: 6px;
	background-color: ${({ theme, $selected }) =>
		$selected ? theme.main.primaryGhost : theme.main.backgroundOne};
	padding: 8px 12px;

	&:hover {
		cursor: pointer;
		background-color: ${({ theme }) => theme.main.primaryGhost};
		border-color: ${({ theme }) => theme.main.primary};
	}
`;

const FooterRow = styled.div`
	display: flex;
	flex-direction: row;
	width: 100%;
	border-top: 1px solid ${({ theme }) => theme.main.border};
	padding: 12px;
	height: fit-content;
	justify-content: end;
	align-items: center;

	button {
		margin-left: 0;
	}
`;

export default {
	Container,
	Row,
	SelectableButton,
	FooterRow,
};
