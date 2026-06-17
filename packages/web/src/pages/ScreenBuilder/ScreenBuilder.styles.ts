import styled from "@emotion/styled";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
	height: 100%;
	width: 100%;
`;

const Header = styled.header`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	width: 100%;
`;

const RowBetween = styled.div`
	display: flex;
	flex-direction: row;
	gap: 12px;
	align-items: center;
`;

const Frame = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	border-radius: 12px;
	border: 1px solid ${({ theme }) => theme.main.border};
	min-height: 0;
`;

const Filters = styled.div`
	display: flex;
	flex-direction: row;
	width: 100%;
	padding: 6px;
	justify-content: space-between;
	align-items: center;
`;

const Item = styled.div`
	display: flex;
	width: 100%;
	height: 100%;
	background-color: ${({ theme }) => theme.main.backgroundTwo};
	border-radius: 10px;
	&:hover {
		background-color: ${({ theme }) => theme.main.backgroundThree};
	}
`;

const GridArea = styled.div`
	display: flex;
	flex: 1 1 0;
	min-height: 0;
	overflow: hidden;
`;

const GridCell = styled.div`
	min-height: 0;
	height: 100%;
`;

export default {
	Container,
	Header,
	RowBetween,
	Frame,
	Filters,
	Item,
	GridArea,
	GridCell,
};
