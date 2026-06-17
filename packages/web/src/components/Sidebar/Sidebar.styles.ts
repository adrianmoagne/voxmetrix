import styled from "@emotion/styled";

const Sidebar = styled.aside<{
	isCollapsed?: boolean;
	isChanging?: boolean;
}>`
	height: 100vh;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border: 1px solid ${({ theme }) => theme.main.border};
	box-shadow: ${({ theme }) => theme.shadows.sidebar};
	overflow: hidden;

	${({ isCollapsed }) =>
		!isCollapsed &&
		`
		animation: expand 0.2s ease-in-out forwards;
	`}

	${({ isCollapsed }) =>
		isCollapsed &&
		`
		animation: collapse 0.2s ease-in-out forwards;
	`}

	@keyframes expand {
		from {
			width: 66px;
		}
		to {
			width: 320px;
		}
	}

	@keyframes collapse {
		from {
			width: 320px;
		}
		to {
			width: 66px;
		}
	}
`;

const Column = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const CollapseWrapper = styled.button<{
	isCollapsed?: boolean;
}>`
	width: 100%;
	height: fit-content;
	cursor: pointer;
	border: none;
	border-radius: 3px;
	padding: 0;
	background: transparent;
	display: flex;
	align-items: flex-start;
	justify-content: flex-end;
	background: inherit;
	transition: all 0.1s ease-in-out;

	${({ isCollapsed }) =>
		isCollapsed &&
		`
		justify-content: center;
	`}
`;

const Header = styled.header<{
	isCollapsed?: boolean;
}>`
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding: 18px;

	${({ isCollapsed }) =>
		isCollapsed &&
		`
		padding: 18px 6px;
		align-items: center;
		justify-content: center;
	`}
`;

export default {
	Sidebar,
	Header,
	CollapseWrapper,
	Column,
};
