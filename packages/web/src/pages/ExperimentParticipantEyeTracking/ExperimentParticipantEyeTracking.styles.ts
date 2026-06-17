import styled from "@emotion/styled";

const Container = styled.div`
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	overflow: hidden;
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	background: ${({ theme }) => theme.main.backgroundOne};


`;

const WelcomeContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	gap: 16px;
	padding: 24px;
	max-width: 600px;
`;

const RequirementsList = styled.ul`
	text-align: left;
	margin: 16px 0;
	padding-left: 24px;
	
	li {
		margin-bottom: 8px;
	}
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

const FormContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 16px;
	padding: 24px;
	max-width: 400px;
	width: 100%;
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
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

export default {
	Container,
	WelcomeContainer,
	RequirementsList,
	ButtonGroup,
	CompletionContainer,
	FormContainer,
	FormField,
	ConsentContainer,
	ConsentText,
};
