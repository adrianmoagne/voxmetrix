import styled from "@emotion/styled";

const Info = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	gap: 6px;
	align-items: center;
	justify-content: center;
	overflow: hidden;

	color: ${({ theme }) => theme.main.textOne};

	.icon {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
		color: ${({ theme }) => theme.main.placeholder};

		svg {
			fill: ${({ theme }) => theme.main.placeholder};
			fill-opacity: 0.2;
			stroke: ${({ theme }) => theme.main.placeholder};
		}
	}
`;

const Filename = styled.div`
	width: 100%;
	text-align: center;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	max-width: 136px; /* 160px card width - 24px padding */
`;

const Row = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	width: 100%;
	color: ${({ theme }) => theme.main.textThree};
	overflow: hidden;
`;

export default { Info, Filename, Row };
