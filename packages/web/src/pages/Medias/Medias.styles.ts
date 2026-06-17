import styled from "@emotion/styled";
import { MEDIA_CARD_SIZE } from "@/components";

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
	display: flex;
	flex-direction: row;
	gap: 12px;

	.chip {
		padding: 8px 12px;
		display: flex;
		align-items: center;

		* {
			font-weight: 500;
			font-size: 14px;
		}

		&:hover {
			cursor: pointer;
			background-color: ${({ theme }) => theme.main.primaryGhost};
		}
	}
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, ${MEDIA_CARD_SIZE}px);
	grid-template-rows: repeat(auto-fill, ${MEDIA_CARD_SIZE}px);
	border-radius: 12px;
	border: 1px solid ${({ theme }) => theme.main.border};
	height: 100%;
	padding: 18px;
	gap: 40px;
	overflow-y: auto;

	/* Custom scrollbar styling */
	&::-webkit-scrollbar {
		width: 8px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
		border-radius: 4px;
	}

	&::-webkit-scrollbar-thumb {
		background: ${({ theme }) => theme.main.border};
		border-radius: 4px;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: ${({ theme }) => theme.main.placeholder};
	}
`;

export default {
	Container,
	Header,
	Filters,
	Grid,
};
