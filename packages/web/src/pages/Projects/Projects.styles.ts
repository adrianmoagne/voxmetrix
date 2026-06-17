import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 24px;
	flex: 1 0 0;
	align-self: stretch;

	/* Row separators */
	.row-only-borders [role="row"] > [role="cell"],
	.row-only-borders [role="row"] > [role="columnheader"],
	.row-only-borders tbody tr > td,
	.row-only-borders thead tr > th {
		border-left: 0 !important;
		border-right: 0 !important;
		box-shadow: none !important; /* in case the lib uses shadows for column lines */
	}

	.row-only-borders [role="row"] > [role="cell"],
	.row-only-borders tbody tr > td {
		border-bottom: 1px solid ${({ theme }) => theme.main.border} !important;
	}

	.row-only-borders [role="row"]:last-of-type > [role="cell"],
	.row-only-borders tbody tr:last-of-type > td {
		border-bottom: 0 !important;
	}

	.row-hover tbody tr:hover > td,
	.row-hover [role="row"]:hover > [role="cell"] {
		background-color: ${({ theme }) => theme.main.defaultGhost};
	}
`;

const RowBetween = styled.div`
	display: flex;
`;

const RowClickable = styled.div`
	display: contents;
	cursor: pointer;
`;

const Cell = styled.div`
	display: flex;
	justify-content: center;
	width: 100%;
`;

export default {
	Container,
	RowBetween,
	RowClickable,
	Cell,
};
