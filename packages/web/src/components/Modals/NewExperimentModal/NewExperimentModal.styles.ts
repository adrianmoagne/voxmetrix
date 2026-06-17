import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-height: 400px;
`;

const FieldGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const TypeSelector = styled.div`
	display: flex;
	flex-direction: row;
	gap: 12px;
`;

interface TypeCardProps {
	selected?: boolean;
}

const TypeCard = styled.div<TypeCardProps>`
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 20px 16px;
	border-radius: 8px;
	border: 2px solid ${({ theme, selected }) =>
		selected ? theme.main.primary : theme.main.border};
	background: ${({ theme, selected }) =>
		selected ? theme.main.primaryGhost : theme.main.backgroundTwo};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background: ${({ theme }) => theme.main.primaryGhost};
	}
`;

const TypeIcon = styled.div<TypeCardProps>`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${({ theme, selected }) =>
		selected ? theme.main.primary : theme.main.backgroundThree};
	color: ${({ theme, selected }) =>
		selected ? theme.main.textContrast : theme.main.textTwo};
	transition: all 0.2s ease;
`;

const FooterRow = styled.div`
	display: flex;
	justify-content: flex-end;
	flex-direction: row;
	gap: 12px;
	margin-top: auto;
	padding-top: 12px;
`;

export default {
	Container,
	FieldGroup,
	TypeSelector,
	TypeCard,
	TypeIcon,
	FooterRow,
};
