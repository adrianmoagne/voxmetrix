import styled from "@emotion/styled";

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const Label = styled.label`
	font-family: "IBM Plex Mono", monospace;
	font-size: 10px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.8px;
	color: ${({ theme }) => theme.main.placeholder};
`;

const Input = styled.input`
	padding: 8px 12px;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 6px;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	color: ${({ theme }) => theme.main.textOne};
	background: ${({ theme }) => theme.main.backgroundOne};
	outline: none;
	transition: border-color 0.15s ease;

	&::placeholder {
		color: ${({ theme }) => theme.main.placeholder};
	}

	&:focus {
		border-color: ${({ theme }) => theme.main.primary};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.main.primaryGhost};
	}
`;

const Select = styled.select`
	padding: 8px 12px;
	border: 1px solid ${({ theme }) => theme.main.border};
	border-radius: 6px;
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	color: ${({ theme }) => theme.main.textOne};
	background: ${({ theme }) => theme.main.backgroundOne};
	outline: none;
	cursor: pointer;
	appearance: none;
	background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23989BA7' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: right 10px center;
	padding-right: 28px;

	&:focus {
		border-color: ${({ theme }) => theme.main.primary};
		box-shadow: 0 0 0 2px ${({ theme }) => theme.main.primaryGhost};
	}
`;

const Hint = styled.div`
	font-size: 11px;
	color: ${({ theme }) => theme.main.textThree};
`;

export default { Field, Label, Input, Select, Hint };
