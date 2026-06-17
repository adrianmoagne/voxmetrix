import styled from "@emotion/styled";

const Wrapper = styled.div`
	width: 320px;
	display: flex;
	flex-direction: row;
	border-radius: 12px;
	align-items: center;
	justify-content: center;
	padding: 6px;
	border: 1px solid ${({ theme }) => theme.main.border};
	box-shadow: ${({ theme }) => theme.shadows.soft};
	background: ${({ theme }) => theme.main.backgroundTwo};
`;

const Button = styled.button<{
	isActive?: boolean;
}>`
	width: 100%;
	padding: 12px;
	border-radius: 8px;
	border: none;
	background: transparent;
	color: ${({ theme }) => theme.main.placeholder};
	font-size: 14px;
	font-weight: 600;

	${({ isActive, theme }) =>
		isActive &&
		`
		background: ${theme.main.backgroundOne};
		border: 1px solid ${theme.main.border};
		color: ${theme.main.textOne};
	`}

	transition: all 0.1s ease-in-out;

	&:hover {
		cursor: pointer;
		color: ${({ theme }) => theme.main.primary};
		border-color: ${({ theme }) => theme.main.primary};
	}
`;

export default { Wrapper, Button };
