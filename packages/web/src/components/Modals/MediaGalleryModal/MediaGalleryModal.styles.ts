import styled from "@emotion/styled";

// const Container = styled.div`
// 	display: flex;
// 	flex-direction: row;
// 	gap: 18px;
// 	width: 100%;
// 	height: 400px;
// 	flex-wrap: wrap;
// `;

const Container = styled.div`
	display: flex;
	padding: 18px;
	align-items: flex-start;
	align-content: flex-start;
	gap: 18px;
	flex: 1 0 0;
	align-self: stretch;
	flex-wrap: wrap;
	min-height: 400px;
	max-height: 400px;
	overflow-y: auto;
`;

// const Info = styled.div`
// 	display: flex;
// 	flex-direction: column;
// 	width: 100%;
// 	gap: 6px;
// 	align-items: center;
// 	justify-content: center;

// 	color: ${({ theme }) => theme.main.textOne};

// 	.icon {
// 		width: 48px;
// 		height: 48px;
// 		flex-shrink: 0;
// 		color: ${({ theme }) => theme.main.placeholder};
// 	}
// `;

const Info = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	align-self: stretch;
	.icon {
		color: ${({ theme }) => theme.main.placeholder};
	}
`;

const Row = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	width: 100%;
	};
`;

const FooterRow = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: fit-content;
	padding: 12px;

	border-top: 1px solid ${({ theme }) => theme.main.border};

	button {
		margin-left: 0;
	}
`;

export default { Container, Info, FooterRow, Row };
