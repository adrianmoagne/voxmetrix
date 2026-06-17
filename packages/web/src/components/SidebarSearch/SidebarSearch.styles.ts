import styled from "@emotion/styled";

const Wrapper = styled.div<{
	isCollapsed?: boolean;
}>`
	width: 100%;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	border: 1px solid ${({ theme }) => theme.main.border};
	position: relative;
	border-radius: 6px;
	height: 42px;

	${({ isCollapsed, theme }) =>
		isCollapsed &&
		`

				width: 42px !important;
				background: ${theme.main.inputBackground};
			`}
`;

const FloatingIcon = styled.div<{
	isCollapsed?: boolean;
}>`
	position: absolute;
	right: 12px;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.1s ease-in-out;
	color: ${({ theme }) => theme.main.placeholder};
	padding: 2px;

	${({ isCollapsed }) =>
		isCollapsed &&
		`
				right: 0;
				left: 0;
			`}

	&:hover {
		color: ${({ theme }) => theme.main.primary};

		.icon {
			fill: ${({ theme }) => theme.main.primary};
			fill-opacity: 0.2;
		}
	}
`;

export default {
	Wrapper,
	FloatingIcon,
};
