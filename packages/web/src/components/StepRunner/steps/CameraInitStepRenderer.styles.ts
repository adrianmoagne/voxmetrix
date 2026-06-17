import styled from "@emotion/styled";

const Layout = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	padding: 24px;
	gap: 24px;
`;

const PreviewMount = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: min(100%, 640px);
	min-height: 360px;
	aspect-ratio: 4 / 3;
	border-radius: 4px;
	overflow: hidden;
	background: #111;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
`;

const InstructionCard = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20px;
	width: min(100%, 640px);
	padding: 28px 32px;
	background: ${({ theme }) => theme.main.backgroundOne};
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
	text-align: center;
`;

const InstructionText = styled.p`
	margin: 0;
	font-size: 16px;
	line-height: 1.5;
	color: ${({ theme }) => theme.main.textOne};
`;

const LoadingState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	gap: 16px;
`;

export default { Layout, PreviewMount, InstructionCard, InstructionText, LoadingState };
