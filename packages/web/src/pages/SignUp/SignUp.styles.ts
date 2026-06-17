import styled from "@emotion/styled";

const Container = styled.div`
	background-color: ${(props) => props.theme.main.backgroundOne};
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100vh;
	width: 100vw;
	gap: 24px;
`;

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
`;

const InputWrapper = styled.div`
	display: flex;
	flex-direction: row;
	position: relative;
`;

const IconWrapper = styled.div`
	width: fit-content;
	height: fit-content;
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: center;
	top: 0;
	bottom: 0;
	margin-bottom: auto;
	margin-top: auto;
	right: 12px;
	padding: 2px;
	cursor: pointer;
	color: ${(props) => props.theme.main.placeholder};

	&:hover {
		color: ${(props) => props.theme.main.primary};
		.icon {
			fill: ${(props) => props.theme.main.primaryGhost};
		}
	}
`;

export default {
	Container,
	Form,
	InputWrapper,
	IconWrapper,
};
