import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
	padding: 32px;
	max-width: 560px;
	animation: ${fadeIn} 0.2s ease;
`;

const Title = styled.h2`
	font-family: "DM Sans", sans-serif;
	font-size: 18px;
	font-weight: 700;
	color: ${({ theme }) => theme.main.textOne};
	margin: 0 0 24px 0;
`;

const Input = styled.input`
	padding: 10px 14px;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 8px;
	font-family: "DM Sans", sans-serif;
	font-size: 14px;
	color: ${({ theme }) => theme.main.textOne};
	background: ${({ theme }) => theme.main.backgroundOne};
	outline: none;

	&::placeholder { color: ${({ theme }) => theme.main.placeholder}; }
	&:focus {
		border-color: ${({ theme }) => theme.main.primary};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.main.primaryGhost};
	}
`;

const Textarea = styled.textarea`
	padding: 10px 14px;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 8px;
	font-family: "DM Sans", sans-serif;
	font-size: 14px;
	color: ${({ theme }) => theme.main.textOne};
	background: ${({ theme }) => theme.main.backgroundOne};
	outline: none;
	resize: vertical;
	min-height: 80px;

	&::placeholder { color: ${({ theme }) => theme.main.placeholder}; }
	&:focus {
		border-color: ${({ theme }) => theme.main.primary};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.main.primaryGhost};
	}
`;

const Readonly = styled.div`
	font-family: "IBM Plex Mono", monospace;
	font-size: 12px;
	color: ${({ theme }) => theme.main.textTwo};
	padding: 8px 0;
	user-select: all;
`;

export default { Content, Title, Input, Textarea, Readonly };
