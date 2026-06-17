import styled from "@emotion/styled";

const Wrapper = styled.div<{ isCollapsed?: boolean }>`
	width: 100%;
	padding: 18px;
	display: flex;
	align-items: center;
	justify-content: center;

	${({ isCollapsed }) =>
		isCollapsed &&
		`
		padding: 18px 0;
	`}
`;

const Container = styled.div<{ isCollapsed?: boolean }>`
	width: 100%;
	border: 1px solid ${({ theme }) => theme.main.border};
	color: ${({ theme }) => theme.main.textTwo};
	padding: 12px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	gap: 12px;
	position: relative;

	${({ isCollapsed }) =>
		isCollapsed &&
		`
		width: 42px;
		height: 42px;
		justify-content: center;
		padding:0;
	`}

	transition: all 0.1s ease-in-out;

	&:hover {
		cursor: pointer;
		border-color: ${({ theme }) => theme.main.default};
		background: ${({ theme }) => theme.main.backgroundOne};
	}
`;

const MenuItemRow = styled.div`
	display: grid;
	grid-template-columns: 20px 1fr;
	align-items: center;
	justify-content: center;
	gap: 6px;
	color: ${({ theme }) => theme.main.textTwo};

	svg {
		fill: ${({ theme }) => theme.main.textTwo};
		fill-opacity: 0.2;
	}
`;

export default {
	Container,
	Wrapper,
	MenuItemRow,
};
