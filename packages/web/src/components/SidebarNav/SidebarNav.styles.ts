import { percent2Hex } from "@/styles";
import styled from "@emotion/styled";

const Menu = styled.nav`
	display: flex;
	flex-direction: column;
	width: 100%;
`;

const MenuItem = styled.div<{
	isActive?: boolean;
	isCollapsed?: boolean;
}>`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	width: 100%;
	cursor: pointer;
	transition: all 0.1s ease-in-out;
	padding: 12px 18px;
	color: ${({ theme }) => theme.main.default};

	.icon {
		fill: ${({ theme }) => theme.main.default};
		fill-opacity: 0.2;

		width: 20px;
		height: 20px;
		transition: all 0.2s ease-in-out;
	}

	gap: 6px;
	height: fit-content;
	position: relative;

	${({ isActive, theme }) =>
		!isActive &&
		`
		&:hover {
		color: ${theme.main.primary + percent2Hex[40]};

		.icon {
			fill: ${theme.main.primary + percent2Hex[40]};
		}
	}
	`}

	${({ isCollapsed }) =>
		isCollapsed &&
		`
		padding: 12px 0;
		width: 100%;
		justify-content: center;

		.icon {
			width: 24px;
			height: 24px;
		}
	`}

	${({ isActive, theme }) =>
		isActive &&
		`color: ${theme.main.primary};
	stroke: ${theme.main.primary};

	.icon {
		fill: ${theme.main.primary};
	}

	&::after {
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		margin: auto;
		height: 28px;
		background: ${theme.main.primary};
		border-top-right-radius: 3px;
		border-bottom-right-radius: 3px;
		width: 4px;
		animation: borderActive 0.2s ease-in-out forwards;
	}

	@keyframes borderActive {
		from {
			width: 0;
		}
		to {
			width: 4px;
		}
	}`};
`;

export default {
	Menu,
	MenuItem,
};
