import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { stepColors } from "@/components/StepCatalog";

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
	padding: 24px 32px;
	animation: ${fadeIn} 0.2s ease;
	max-width: 48rem;
	margin: 0 auto;
	width: 100%;
`;

const BlockCard = styled.div`
	margin-bottom: 24px;
	background-color: ${({ theme }) => theme.main.backgroundOne};
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 12px;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	overflow: hidden;
`;

const BlockHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	background-color: ${({ theme }) => theme.main.backgroundTwo};

	.hover-action { opacity: 0; transition: opacity 0.2s; }
	&:hover .hover-action { opacity: 1; }
`;

const DragHandle = styled.span`
	color: ${({ theme }) => theme.main.placeholder};
	cursor: grab;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const NameInput = styled.input`
	border: none;
	outline: none;
	background: transparent;
	font-family: "DM Sans", sans-serif;
	font-size: 15px;
	font-weight: 600;
	color: ${({ theme }) => theme.main.textOne};
	padding: 2px 4px;
	flex: 1;
	border-bottom: 1px solid transparent;

	&:hover { border-bottom-color: ${({ theme }) => theme.main.border}; }
	&:focus { border-bottom-color: ${({ theme }) => theme.main.primary}; outline: none; }
`;

const IconButton = styled.button`
	padding: 6px;
	border-radius: 6px;
	color: ${({ theme }) => theme.main.placeholder};
	background: transparent;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;

	&:hover { 
		background-color: ${({ theme }) => theme.main.backgroundThree}; 
		color: ${({ theme }) => theme.main.textOne};
	}

	&.danger:hover {
		background-color: ${({ theme }) => theme.main.dangerGhost};
		color: ${({ theme }) => theme.main.danger};
	}
`;

const CollapseContent = styled.div<{ $isOpen: boolean }>`
	display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
`;

const StepsContainer = styled.div`
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const StepRow = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 12px;
	border-radius: 8px;
	border: 1px solid transparent;
	transition: all 0.2s;
	cursor: pointer;

	.hover-action { opacity: 0; transition: opacity 0.2s; }

	&:hover {
		background-color: ${({ theme }) => theme.main.backgroundTwo};
		border-color: ${({ theme }) => theme.main.border};
	}
	&:hover .hover-action { opacity: 1; }
`;

const IconWrapper = styled.div<{ $kind?: string }>`
	padding: 6px;
	border-radius: 6px;
	background-color: ${({ $kind }) => stepColors[$kind ?? "Screen"]?.bg ?? "#eef0fb"};
	color: ${({ $kind }) => stepColors[$kind ?? "Screen"]?.icon ?? "#4554b8"};
	border: 1px solid ${({ $kind }) => stepColors[$kind ?? "Screen"]?.border ?? "#eef0fb"};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const StepName = styled.span`
	font-family: "DM Sans", sans-serif;
	font-size: 14px;
	font-weight: 500;
	color: ${({ theme }) => theme.main.textOne};
`;

const TypeBadge = styled.span<{ $kind?: string }>`
	font-family: "IBM Plex Mono", monospace;
	font-size: 10px;
	font-weight: 600;
	text-transform: uppercase;
	color: ${({ $kind }) => stepColors[$kind ?? "Screen"]?.fg ?? "#4554b8"};
	background-color: ${({ theme }) => theme.main.backgroundOne};
	padding: 2px 6px;
	border-radius: 4px;
	border: 1px solid ${({ theme }) => theme.main.border};
`;

const StepSpacer = styled.div`
	flex: 1;
`;

const SmallLabel = styled.span`
	font-family: "DM Sans", sans-serif;
	font-size: 12px;
	font-weight: 500;
	color: ${({ theme }) => theme.main.primary};
`;

const AddStepButton = styled.button`
	width: 100%;
	padding: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	font-weight: 500;
	color: ${({ theme }) => theme.main.textTwo};
	background: transparent;
	border: 1px dashed ${({ theme }) => theme.main.border};
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s;
	margin-top: 8px;

	&:hover {
		color: ${({ theme }) => theme.main.primary};
		background-color: ${({ theme }) => theme.main.primaryGhost};
		border-color: ${({ theme }) => theme.main.primary};
	}
`;

const AddBlockButton = styled(AddStepButton)`
	padding: 16px;
	font-size: 14px;
	margin-top: 0;
	color: ${({ theme }) => theme.main.primary};
`;

export default {
	Content, BlockCard, BlockHeader, DragHandle, NameInput, IconButton,
	CollapseContent, StepsContainer, StepRow, IconWrapper, StepName, TypeBadge,
	StepSpacer, SmallLabel, AddStepButton, AddBlockButton,
};
