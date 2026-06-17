import styled from "@emotion/styled";
import type { LeColorScheme } from "@leux/ui";

const Button = styled.button<{
	onlyIcon?: boolean;
	colorScheme: LeColorScheme;
	fillIcon?: boolean;
}>`
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	box-shadow: ${({ theme }) => theme.shadows.soft};
	gap: 6px;

	background: ${({ theme }) => theme.main.backgroundOne};
	border-radius: 6px;
	border: 1px solid ${({ theme }) => theme.main.border};
	cursor: pointer;
	transition: all 0.1s ease-in-out;

	color: ${({ theme }) => theme.main.textTwo};

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: fit-content;
		height: fit-content;
		color: ${({ theme, colorScheme }) => theme.main[colorScheme]};
	}

	${({ fillIcon, theme, colorScheme }) =>
		fillIcon &&
		`
		svg {
			fill-opacity: 0.2;
			fill: ${theme.main[colorScheme]};
		}
	`}

	${({ onlyIcon }) =>
		onlyIcon
			? `
		width: 32px;
		height: 32px;
	`
			: `
		padding: 8px 12px
	`};

	&:hover {
		border-color: ${({ theme, colorScheme }) => theme.main[colorScheme]};
	}

	&:disabled {
		cursor: not-allowed;
		background: ${({ theme }) => theme.main.disabled} !important;
		color: ${({ theme }) => theme.main.textThree} !important;

		.icon {
			svg {
				color: ${({ theme }) => theme.main.textThree} !important;
				fill: none !important;
			}
		}
		border: none !important;
	}
`;

export default { Button };
