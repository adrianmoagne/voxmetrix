import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const Divider = styled.div`
	height: 1px;
	width: 100%;
	background-color: ${({ theme }) => theme.main.border};
`;

const Group = styled.div`
	display: flex;
	flex-direction: column;
`;

const RowBetween = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const Row = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

const ThemeImage = styled.img`
	width: 140px;
	height: auto;
`;

const SelectTheme = styled.div<{ isSelected: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 2px;
	position: relative;
	padding: 6px;

	.theme-label {
		padding: 0 12px;
	}
	opacity: 0.6;
	transition: all 0.1s ease-in-out;

	&:hover {
		cursor: pointer;
		opacity: 0.8;

		&:after {
			border-color: ${({ theme }) => theme.main.primary} !important;
		}
	}

	&:after {
		content: "";
		position: absolute;
		width: 9px;
		height: 9px;
		border-radius: 8px;
		border: 2px solid
			${({ theme, isSelected }) => (isSelected ? theme.main.primary : theme.main.border)};
		top: 8px;
		right: 18px;
		background: ${({ isSelected, theme }) =>
			isSelected ? theme.main.primaryGhost : theme.main.backgroundOne};
	}

	${({ isSelected }) =>
		isSelected &&
		`
		opacity: 1 ;
	`};
`;

export default {
	Container,
	Divider,
	Group,
	RowBetween,
	Row,
	ThemeImage,
	SelectTheme,
};
