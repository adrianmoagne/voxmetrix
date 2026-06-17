import styled from "@emotion/styled";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 24px;
	height: 100%;
	overflow-y: auto;
	background: ${({ theme }) => theme.main.backgroundTwo};
`;

const Header = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
`;

const Stats = styled.div`
	display: flex;
	flex-direction: row;
	gap: 24px;
`;

const StatCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 16px 24px;
	background: white;
	border-radius: 12px;
	border: 1px solid ${({ theme }) => theme.main.border};
`;

const ResultsTable = styled.div`
	display: flex;
	flex-direction: column;
	background: white;
	border-radius: 12px;
	border: 1px solid ${({ theme }) => theme.main.border};
`;

const TableHeader = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr;
	gap: 8px;
	padding: 12px 24px;
	background: ${({ theme }) => theme.main.backgroundOne};
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
`;

const TableRow = styled.div<{ clickable?: boolean }>`
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr;
	gap: 8px;
	padding: 12px 24px;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	cursor: ${({ clickable }) => (clickable ? "pointer" : "default")};

	&:hover {
		background: ${({ theme, clickable }) =>
    clickable ? theme.main.backgroundTwo : "transparent"};
	}

	&:last-child {
		border-bottom: none;
	}
`;

const TrialsSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-top: 16px;
`;

const TrialCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px;
	background: white;
	border-radius: 8px;
	border: 1px solid ${({ theme }) => theme.main.border};
`;

const TrialHeader = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
`;

const GazeStats = styled.div`
	display: flex;
	flex-direction: row;
	gap: 16px;
	flex-wrap: wrap;
	margin-top: 8px;
`;

const GazeStat = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 8px 12px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-radius: 6px;
`;

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	gap: 12px;
`;

const ExportButtons = styled.div`
	display: flex;
	flex-direction: row;
	gap: 8px;
`;

export default {
  Container,
  Header,
  Stats,
  StatCard,
  ResultsTable,
  TableHeader,
  TableRow,
  TrialsSection,
  TrialCard,
  TrialHeader,
  GazeStats,
  GazeStat,
  EmptyState,
  ExportButtons,
};
