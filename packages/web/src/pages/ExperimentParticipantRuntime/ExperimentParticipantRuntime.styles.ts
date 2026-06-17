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

const WelcomeContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	gap: 16px;
	padding: 24px;
`;

const FormContainer = styled.div`
	max-width: 400px;
	margin: 0 auto;
	padding: 24px;
`;

const FormField = styled.div`
	margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	justify-content: center;
	margin-top: 24px;
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

const ConsentContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24px;
	padding: 24px;
	max-width: 800px;
	width: 100%;
`;

const ConsentText = styled.div`
	max-height: 60vh;
	overflow-y: auto;
	padding: 24px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-radius: 8px;
	text-align: left;
	line-height: 1.6;
	font-size: 14px;

	h4 {
		margin-top: 16px;
		margin-bottom: 8px;
	}
`;

const ExperimentStepContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
	width: 100%;
	overflow-y: auto;
	overflow-x: hidden;
	margin: 0;
	padding: 0;

	> * {
		min-height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
	}
`;

const RuntimeOverlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: ${({ theme }) => theme.main.backgroundOne};

	> * {
		flex: 1;
		min-height: 0;
		width: 100%;
	}
`;

export default {
	Container,
	ExperimentStepContainer,
	RuntimeOverlay,
	WelcomeContainer,
	FormContainer,
	FormField,
	ButtonGroup,
	CompletionContainer,
	ConsentContainer,
	ConsentText,
};
