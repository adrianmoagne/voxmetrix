import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

export const stepColors: Record<string, { bg: string; fg: string; border: string; icon: string }> = {
	Screen:          { bg: "#eef0fb", fg: "#4554b8", border: "#7080d4", icon: "#5D69D9" },
	FixationStep:    { bg: "#e8f5f1", fg: "#2a8060", border: "#4aad8a", icon: "#70C1B3" },
	CalibrationStep: { bg: "#fdf4e8", fg: "#a06820", border: "#d49040", icon: "#E8A742" },
	ValidationStep:  { bg: "#eef7ee", fg: "#3a7a3a", border: "#5aaa5a", icon: "#70C140" },
	FeedbackStep:    { bg: "#f5eef8", fg: "#7040a0", border: "#a060c8", icon: "#9B8EC4" },
};

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to { opacity: 1; transform: translateY(0); }
`;

const Anchor = styled.div`
	position: relative;
	flex-shrink: 0;
`;

const Dropdown = styled.div`
	position: absolute;
	top: calc(100% + 8px);
	left: 0;
	background: ${({ theme }) => theme.main.backgroundOne};
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 10px;
	min-width: 200px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	z-index: 20;
	overflow: hidden;
	animation: ${fadeIn} 0.15s ease;
`;

const Item = styled.button<{ $kind: string }>`
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 10px 14px;
	border: none;
	background: transparent;
	cursor: pointer;
	text-align: left;
	transition: background 0.1s ease;

	&:hover {
		background: ${({ theme }) => theme.main.backgroundTwo};
	}
`;

const ItemIcon = styled.div<{ $kind: string }>`
	width: 28px;
	height: 28px;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background: ${({ $kind }) => stepColors[$kind]?.bg ?? "#eef0fb"};
	color: ${({ $kind }) => stepColors[$kind]?.icon ?? "#5D69D9"};
	border: 1px solid ${({ $kind }) => stepColors[$kind]?.border ?? "#7080d4"};
`;

const ItemLabel = styled.div`
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	font-weight: 500;
	color: ${({ theme }) => theme.main.textOne};
`;

const ItemSub = styled.div`
	font-family: "IBM Plex Mono", monospace;
	font-size: 10px;
	color: ${({ theme }) => theme.main.placeholder};
`;

const IconWrapper = styled.div<{ $kind?: string }>`
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${({ $kind }) => stepColors[$kind ?? "Screen"]?.bg ?? "#eef0fb"};
	color: ${({ $kind }) => stepColors[$kind ?? "Screen"]?.icon ?? "#5D69D9"};
	border: 1px solid ${({ $kind }) => stepColors[$kind ?? "Screen"]?.border ?? "#7080d4"};
`;

export default { Anchor, Dropdown, Item, ItemIcon, ItemLabel, ItemSub, IconWrapper };
