import styled from "@emotion/styled";
import { css } from "@emotion/react";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	overflow: hidden;
	position: relative;
	background-color: black;
	&::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: ${({ theme }) => theme.main.primary};
		z-index: 50;
	}
`;

const TopBar = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 20px;
	padding-top: 12px;
	background: ${({ theme }) => theme.main.backgroundOne};
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	flex-shrink: 0;
`;

const ExperimentName = styled.input`
	border: none;
	outline: none;
	background: transparent;
	font-family: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;
	font-size: 15px;
	font-weight: 700;
	letter-spacing: -0.2px;
	color: ${({ theme }) => theme.main.textOne};
	padding: 4px 10px 4px 12px;
	min-width: 160px;
	max-width: 280px;
	border-left: 3px solid ${({ theme }) => theme.main.primary};
	transition: border-color 0.15s ease;

	&::placeholder {
		color: ${({ theme }) => theme.main.placeholder};
		font-weight: 400;
	}
	&:focus {
		border-left-color: ${({ theme }) => theme.main.tertiary};
	}
`;

const ActionButton = styled.button<{ $variant?: "primary" | "run" }>`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 14px;
	border-radius: 6px;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.15s ease;

	${({ $variant, theme }) =>
		$variant === "primary"
			? css`
					border: none;
					background: ${theme.main.primary};
					color: ${theme.main.white};
					&:hover {
						background: ${theme.main.tertiary};
					}
			  `
			: $variant === "run"
			? css`
					border: 1px solid ${theme.main.success};
					background: transparent;
					color: ${theme.main.success};
					&:hover {
						background: ${theme.main.success};
						color: ${theme.main.white};
					}
			  `
			: css`
					border: 1px solid ${theme.main.border};
					background: ${theme.main.backgroundOne};
					color: ${theme.main.textTwo};
					&:hover {
						background: ${theme.main.backgroundTwo};
					}
			  `}
`;

const Shell = styled.div`
	display: flex;
	flex: 1;
	min-height: 0;
`;

const Sidebar = styled.nav`
	display: flex;
	flex-direction: column;
	width: 52px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-right: 1px solid ${({ theme }) => theme.main.border};
	padding: 8px 0;
	gap: 2px;
	flex-shrink: 0;
`;

const SidebarItem = styled.button<{ $active?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 3px;
	width: 44px;
	height: 44px;
	margin: 0 auto;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.12s ease;
	background: ${({ $active, theme }) => ($active ? theme.main.primaryGhost : "transparent")};
	color: ${({ $active, theme }) => ($active ? theme.main.primary : theme.main.placeholder)};

	&:hover {
		background: ${({ $active, theme }) =>
			$active ? theme.main.primaryGhost : theme.main.backgroundThree};
		color: ${({ $active, theme }) => ($active ? theme.main.primary : theme.main.textOne)};
	}
`;

const SidebarLabel = styled.span`
	font-family: "DM Sans", sans-serif;
	font-size: 8px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.3px;
`;

const Content = styled.main`
	flex: 1;
	min-width: 0;
	overflow: auto;
	background: ${({ theme }) => theme.main.backgroundOne};
`;

const SaveToast = styled.div<{ $visible: boolean }>`
	position: fixed;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 18px;
	border-radius: 8px;
	background: ${({ theme }) => theme.main.textOne};
	color: ${({ theme }) => theme.main.white};
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	font-weight: 500;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	z-index: 100;
	transform: translateY(${({ $visible }) => ($visible ? "0" : "12px")});
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
	transition: all 0.25s ease;
`;

export default {
	Container,
	TopBar,
	ExperimentName,
	ActionButton,
	Shell,
	Sidebar,
	SidebarItem,
	SidebarLabel,
	Content,
	SaveToast,
};
