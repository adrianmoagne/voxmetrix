import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;

	/* Add smooth transition to table rows */
	tbody tr {
		transition: all 0.3s ease-in-out;
	}
`;

const Actions = styled.div`
	display: flex;
	flex-direction: row;
	gap: 12px;
	align-items: center;
	justify-content: center;
`;

const ActionIcon = styled.button`
	width: fit-content;
	height: fit-content;
	padding: 4px;
	border: none;
	outline: none;
	cursor: pointer;
	background-color: transparent;
	color: ${({ theme }) => theme.main.textThree};

	&:hover {
		transform: scale(1.05);
		color: ${({ theme }) => theme.main.primary};
	}

	&:disabled {
		cursor: not-allowed !important;
		opacity: 0.5;
		color: ${({ theme }) => theme.main.textThree};
	}
`;

export default {
	Container,
	Actions,
	ActionIcon,
};
