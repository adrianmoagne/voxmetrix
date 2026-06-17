import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 12px;
	height: 450px;
`;

const FooterRow = styled.div`
	display: flex;
	justify-content: center;
	flex-direction: row;
	margin-top: auto;
	width: 100%;
	padding: 12px;
`;

const Options = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	flex: 1;
	overflow-y: auto;
	min-height: 0;
`;

const OptionCard = styled.div<{ $selected?: boolean }>`
	display: flex;
	width: 100%;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 18px;
	height: fit-content;
	border-radius: 12px;
	border: 1px solid
		${({ theme, $selected }) => ($selected ? theme.main.primary : theme.main.border)};
	background-color: ${({ theme }) => theme.main.backgroundOne};
	cursor: pointer;
	transition: all 0.1s ease-in-out;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background-color: ${({ theme }) => theme.main.primaryGhost};
	}
`;

const Divider = styled.div`
	height: 1px;
	width: 100%;
	background-color: ${({ theme }) => theme.main.border};
`;

export default {
	Container,
	FooterRow,
	Options,
	OptionCard,
	Divider,
};
