import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to { opacity: 1; transform: translateY(0); }
`;

const Form = styled.div`
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 20px;
	max-width: 480px;
	animation: ${fadeIn} 0.2s ease;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

const Title = styled.div`
	font-size: 16px;
	font-weight: 600;
	color: ${({ theme }) => theme.main.textOne};
`;

const Subtitle = styled.div`
	font-family: "IBM Plex Mono", monospace;
	font-size: 10px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.6px;
	color: ${({ theme }) => theme.main.placeholder};
	margin-top: 2px;
`;

export default { Form, Header, Title, Subtitle };
