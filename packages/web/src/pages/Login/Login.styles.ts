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

const Title = styled.h1``;

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
`;

export default {
	Container,
	Title,
	Form,
};
