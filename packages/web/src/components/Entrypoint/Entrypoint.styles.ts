import styled from "@emotion/styled";

const Wrapper = styled.div`
	display: flex;
	flex-direction: row;
	height: 100vh;
	width: 100vw;
	overflow: hidden;
	background: ${({ theme }) => theme?.main.backgroundOne};
`;

const Content = styled.main`
	flex: 1;
	width: 100%;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	padding: 32px;
`;

export default {
	Wrapper,
	Content,
};
