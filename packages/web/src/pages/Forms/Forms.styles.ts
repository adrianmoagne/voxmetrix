import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 24px;
	flex: 1 0 0;
	align-self: stretch;
`;

const Header = styled.header`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	width: 100%;
`;

const RowBetween = styled.div`
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const Filters = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: 12px;

	.custom-select {
		width: 120px;
		text-align: center;
		font-weight: 600;
		background-color: ${({ theme }) => theme.main.defaultGhost};
	}
`;

const ActionsRow = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
`;

export default {
	Container,
	Header,
	RowBetween,
	Filters,
	ActionsRow,
};
