import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 12px;
	height: 350px;
`;

const FooterRow = styled.div`
	display: flex;
	justify-content: center;
	flex-direction: row;
	margin-top: auto;
	padding: 12px;
`;

export default {
	Container,
	FooterRow,
};
