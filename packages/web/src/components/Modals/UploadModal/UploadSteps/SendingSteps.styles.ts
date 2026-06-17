import styled from "@emotion/styled";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding: 18px;
	width: 100%;
	height: 433px;

	svg {
		color: ${({ theme }) => theme.main.placeholder};
	}
`;

const Column = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
`;

export default {
	Container,
	Column,
};
