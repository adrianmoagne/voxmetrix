import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-height: 400px;
`;

const InputWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const EmailInput = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
`;

const ChipsContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	min-height: 60px;
	padding: 12px;
	background-color: ${({ theme }) => theme.main.inputBackground};
	border-radius: 8px;
	align-content: flex-start;
`;

const Chip = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	background-color: ${({ theme }) => theme.main.primaryGhost};
	border-radius: 16px;
	font-size: 14px;
	color: ${({ theme }) => theme.main.primary};
`;

const ChipRemove = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0;
	color: ${({ theme }) => theme.main.primary};
	font-size: 16px;
	line-height: 1;

	&:hover {
		color: ${({ theme }) => theme.main.tertiary};
	}
`;

const ResultMessage = styled.div<{ variant: "success" | "warning" | "error" }>`
	padding: 12px;
	border-radius: 8px;
	font-size: 14px;
	background-color: ${({ theme, variant }) => {
		switch (variant) {
			case "success":
				return theme.main.successGhost;
			case "warning":
				return theme.main.warningGhost;
			case "error":
				return theme.main.dangerGhost;
			default:
				return theme.main.inputBackground;
		}
	}};
	color: ${({ theme, variant }) => {
		switch (variant) {
			case "success":
				return theme.main.success;
			case "warning":
				return theme.main.warning;
			case "error":
				return theme.main.danger;
			default:
				return theme.main.textOne;
		}
	}};
`;

const FooterRow = styled.div`
	display: flex;
	justify-content: flex-end;
	flex-direction: row;
	gap: 12px;
	margin-top: auto;
	padding: 12px 0;
`;

const EmailCount = styled.span`
	font-size: 12px;
	color: ${({ theme }) => theme.main.placeholder};
`;

export default {
	Container,
	InputWrapper,
	EmailInput,
	ChipsContainer,
	Chip,
	ChipRemove,
	ResultMessage,
	FooterRow,
	EmailCount,
};
