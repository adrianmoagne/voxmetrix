import styled from "@emotion/styled";
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

const NavBarHeaderActions = styled.div`
	display: flex;
	justify-content: flex-end;
	align-items: center;
	flex-direction: row;
	gap: 12px;
`;
const Board = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 200px));
	align-items: center;
	gap: 24px;
	align-content: start;
	flex: 1;
	min-height: 0;
	overflow: auto;
	background-color: ${({ theme }) => theme.main.backgroundTwo};
	padding: 24px;
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
const ScreenCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	align-items: start;
	width: 200px;
	height: 180px;
	justify-content: center;
	align-items: center;
	position: relative;

	& > .delete-btn {
		opacity: 0;
	}

	&:hover > .delete-btn {
		opacity: 1;
	}
`;

const DeleteButton = styled.button`
	position: absolute;
	top: 0;
	right: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border: none;
	border-radius: 50%;
	background-color: ${({ theme }) => theme.main.backgroundOne};
	cursor: pointer;
	transition: opacity 0.15s ease-in-out, background-color 0.15s ease-in-out;
	z-index: 10;

	&:hover {
		background-color: ${({ theme }) => theme.main.dangerGhost};
	}
`;

export default {
	NavBarHeader,
	NavBarHeaderActions,
	Board,
	CreateScreenButton,
	ScreenCard,
	DeleteButton,
};
