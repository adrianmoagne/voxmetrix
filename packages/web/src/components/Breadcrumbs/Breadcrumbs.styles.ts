import styled from "@emotion/styled";

const Wrapper = styled.div`
	display: flex;
	flex-direction: row;
	gap: 6px;
	align-items: center;
	color: ${({ theme }) => theme.main.placeholder};
`;

const Item = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;

	* {
		letter-spacing: 1px !important;
	}
`;

export default {
	Wrapper,
	Item,
};
