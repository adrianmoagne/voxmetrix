import styled from "@emotion/styled";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100vh;
	width: 100vw;
	justify-content: center;
	align-items: center;
	overflow: hidden;
	margin: 0;
	padding: 0;
`;

const CompletionContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	gap: 16px;
	padding: 24px;
`;

export default {
	Container,
	CompletionContainer,
};
