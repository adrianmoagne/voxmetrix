import styled from "@emotion/styled";

const Container = styled.div`
	height: 450px;
	width: 100%;
	display: flex;
	flex-direction: column;
	padding: 6px;
	padding-bottom: 18px;
`;

const Row = styled.div`
	display: flex;
	flex-direction: row;
	width: 100%;
	height: 100%;
	gap: 18px;
`;

const Details = styled.div`
	display: flex;
	width: 100%;
	flex-direction: column;
	gap: 12px;
`;

const Image = styled.img`
	width: 280px;
	height: auto;
	object-fit: cover;
`;

const RowBetween = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	width: 100%;
`;

const Column = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	gap: 6px;
`;

const FooterRow = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: fit-content;
	padding: 12px;

	border-top: 1px solid ${({ theme }) => theme.main.border};

	button {
		margin-left: 0;
	}
`;

export default {
	Container,
	Row,
	Details,
	Image,
	RowBetween,
	Column,
	FooterRow,
};
