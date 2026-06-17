import styled from "@emotion/styled";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
	width: 100%;
	min-height: 150px;
	max-height: 400px;
	padding: 18px;
`;

const DropZone = styled.div`
	display: flex;
	flex-direction: column;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 6px;
	background-color: ${({ theme }) => theme.main.backgroundTwo};
	cursor: pointer;
	width: 100%;
	height: 99px;
	justify-content: center;
	align-items: center;
	padding: 12px;
	gap: 12px;
	position: relative;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background-color: ${({ theme }) => theme.main.primaryGhost};
	}

	svg {
		color: ${({ theme }) => theme.main.placeholder};
	}
`;
const FileInput = styled.input`
	position: absolute;
	width: 100%;
	height: 100%;
	opacity: 0;
	cursor: pointer;
`;

const FooterRow = styled.div`
	display: flex;
	flex-direction: row;
	width: 100%;
	border-top: 1px solid ${({ theme }) => theme.main.border};
	padding: 12px;
	height: fit-content;
	justify-content: end;
	align-items: center;

	button {
		margin-left: 0;
	}
`;

const FileList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	width: 100%;
`;

const Row = styled.div`
	display: flex;
	flex-direction: row;
	width: 100%;
	height: 100%;
	gap: 6px;
`;

const FileItem = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	svg {
		cursor: pointer;
		color: ${({ theme }) => theme.main.placeholder};
		&:hover {
			color: ${({ theme }) => theme.main.danger};
		}
	}
`;

export default {
	Container,
	DropZone,
	Row,
	FileItem,
	FileList,
	FileInput,
	FooterRow,
};
