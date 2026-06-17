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

const PreviewBanner = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
	color: white;
	padding: 8px 16px;
	text-align: center;
	font-weight: 600;
	font-size: 14px;
	z-index: 10000;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
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
	PreviewBanner,
	CompletionContainer,
};
