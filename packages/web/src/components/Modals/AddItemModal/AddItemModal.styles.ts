import styled from "@emotion/styled";
const Container = styled.div`
	display: flex;
	gap: 18px;
	flex-direction: column;
	width: 100%;
	height: 600px;
`;

const DropZone = styled.div`
	display: flex;
	flex-direction: column;
	border: 1px dashed ${({ theme }) => theme.main.border};
	border-radius: 6px;
	background-color: ${({ theme }) => theme.main.backgroundTwo};
	cursor: pointer;
	width: 100%;
	height: 60px;
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

const Grid = styled.div`
	display: grid;
	width: 160px;
	height: 120px;
	row-gap: 6px;
	column-gap: 6px;
	grid-template-rows: repeat(3, minmax(0, 1fr));
	grid-template-columns: repeat(3, minmax(0, 1fr));
`;

const SelectableButton = styled.button<{ $selected: boolean }>`
	border: 1px solid
		${({ theme, $selected }) => ($selected ? theme.main.primary : theme.main.border)};
	border-radius: 6px;
	background-color: ${({ theme, $selected }) =>
		$selected ? theme.main.primaryGhost : theme.main.backgroundOne};
	padding: 6px;

	&:hover {
		cursor: pointer;
		background-color: ${({ theme }) => theme.main.primaryGhost};
		border-color: ${({ theme }) => theme.main.primary};
	}
`;
const Wrapper = styled.div`
	width: 100%;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	border: 1px solid ${({ theme }) => theme.main.border};
	position: relative;
	border-radius: 6px;
`;

const FloatingIcon = styled.div`
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
`;

const Row = styled.div`
	display: flex;
	flex-direction: row;
	gap: 12px;
	width: 100%;
	align-items: center;
`;

const TextEditor = styled.textarea`
	width: 100%;
	height: 100%;
	background-color: ${({ theme }) => theme.main.backgroundTwo};
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 6px;
	padding: 12px;
`;

const ArtifictCard = styled.div`
	display: flex;
	gap: 12px;
	border-radius: 6px;
	border: 1px solid ${({ theme }) => theme.main.border};
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
`;

const FormsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 200px;
	overflow-y: auto;
	width: 100%;
`;

const FormCard = styled.div<{ $selected?: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 12px;
	border: 1px solid ${({ theme, $selected }) => ($selected ? theme.main.primary : theme.main.border)};
	border-radius: 6px;
	background-color: ${({ theme, $selected }) =>
		$selected ? theme.main.primaryGhost : theme.main.backgroundTwo};
	cursor: pointer;
	transition: all 0.15s ease-in-out;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background-color: ${({ theme }) => theme.main.primaryGhost};
	}
`;

export default {
	Container,
	DropZone,
	Grid,
	SelectableButton,
	Wrapper,
	FloatingIcon,
	Row,
	TextEditor,
	ArtifictCard,
	FooterRow,
	FormsList,
	FormCard,
};
