import styled from "@emotion/styled";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
	height: 100%;
	width: 100%;
`;

const Header = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const Filters = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: 12px;

	.custom-select {
		width: 120px;
		text-align: center;
		font-weight: 600;
		background-color: ${({ theme }) => theme.main.defaultGhost};
	}
`;
export default {
	Container,
	Header,
	Filters,
};
