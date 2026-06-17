import styled from "@emotion/styled";
import { percent2Hex } from "@/styles";

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 24px;
	flex: 1 0 0;
	align-self: stretch;
`;

const NavBar = styled.div`
	display: flex;
	flex-direction: row;
	gap: 12px;
	align-items: center;
	padding: 0 24px;
`;

const RowBetween = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	width: 100%;
`;

const NavBarItem = styled.div<{ active?: boolean }>`
	display: flex;
	padding: 6px 24px;
	align-items: center;
	gap: 6px;
	cursor: pointer;
	position: relative;

	&::after {
		content: "";
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: -1px;
		height: 2px;
		background: ${({ theme, active }) => (active ? theme.main.primary : "transparent")};
		border-radius: 2px;
	}

	&:hover::after {
		background: ${({ theme, active }) =>
			!active ? theme.main.primary + percent2Hex[40] : theme.main.primary};
	}
`;

const Frame = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
	height: 100%;
`;

const Board = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 200px));
	align-items: center;
	gap: 24px;
	align-content: start;
	height: 100%;
	background-color: ${({ theme }) => theme.main.backgroundTwo};
	padding: 24px;
`;

const NavBarContent = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 18px;
	overflow: hidden;
`;

const NavBarHeader = styled.div`
	display: flex;
	background: white;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	padding: 12px;
	gap: 12px;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
`;

const NewScreenCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 5px;
	border: 1px solid ${({ theme }) => theme.main.primaryGhost};
	border-radius: 12px;
	height: 160px;
	width: 200px;
	background-color: ${({ theme }) => theme.main.primaryGhost};
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
	transition: all 0.1s ease-in-out;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		opacity: 0.9;
	}
`;

const ScreenCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	align-items: start;
	width: 200px;
	height: 180px;
	justify-content: center;
	align-items: center;
`;

const CreateScreenButton = styled.button`
	display: flex;
	flex-direction: row;
	gap: 6px;
	align-items: center;
	cursor: pointer;
	justify-content: center;
	outline: none;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 8px;
	color: ${({ theme }) => theme.main.textOne};
	padding: 12px;
	font-size: 14px;
	font-weight: 600;
	background-color: white;

	&:hover {
		background-color: ${({ theme }) => theme.main.primaryGhost};
		border-color: ${({ theme }) => theme.main.primary};
		transition: all 0.1s ease-in-out;
	}
`;

const NavBarHeaderActions = styled.div`
	display: flex;
	justify-content: flex-end;
	align-items: center;
	flex-direction: row;
	gap: 12px;
`;

export default {
	Container,
	RowBetween,
	NavBar,
	Frame,
	Board,
	NavBarItem,
	NavBarContent,
	NavBarHeader,
	NewScreenCard,
	ScreenCard,
	CreateScreenButton,
	NavBarHeaderActions,
};
