import styled from "@emotion/styled";

const Screen = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
	border-radius: 8px;
	background: ${({ theme }) => theme.main.backgroundOne};
	cursor: pointer;
	transition: all 0.2s ease-in-out;
	border: 1px solid ${({ theme }) => theme.main.border};
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: repeat(3, 1fr);
	overflow: hidden;

	&:hover {
		background-color: ${({ theme }) => theme.main.secondaryGhost};
		border-color: ${({ theme }) => theme.main.secondary};
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
`;

const Tile = styled.div<{ hasItem?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;

	${({ hasItem, theme }) =>
		hasItem &&
		`
		background: ${theme.main.backgroundTwo};
	 	color: ${theme.main.placeholder};
		border: 1px solid ${theme.main.border};
		border-radius: 4px;
	`}
`;

export default {
	Screen,
	Tile,
};
