import styled from "@emotion/styled";

const Container = styled.div<{
	isClickable?: boolean;
}>`
	background-color: ${({ theme }) => theme.main.backgroundOne};
	display: flex;
	flex-direction: column;
	height: fit-content;
	padding: 32px 18px;
	border: 1px solid ${(props) => props.theme.main.border};
	border-radius: 12px;
	box-shadow: ${(props) => props.theme.shadows?.soft};

	transition: all 0.1s ease-in-out;

	&:hover {
		${({ isClickable, theme }) =>
			isClickable &&
			`
		cursor: pointer;
		border-color: ${theme.main.primary};
	`}
	}
`;

export default {
	Container,
};
