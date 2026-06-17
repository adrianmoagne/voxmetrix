import styled from "@emotion/styled";

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px 20px;
	background: ${({ theme }) => theme.main.backgroundOne};
	border-bottom: 1px solid ${({ theme }) => theme.main.border};
	flex-shrink: 0;
`;

const BackButton = styled.button`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 5px 12px;
	border-radius: 6px;
	border: 1px solid ${({ theme }) => theme.main.border};
	background: ${({ theme }) => theme.main.backgroundOne};
	font-family: "DM Sans", sans-serif;
	font-size: 12px;
	font-weight: 500;
	color: ${({ theme }) => theme.main.textTwo};
	cursor: pointer;

	&:hover {
		background: ${({ theme }) => theme.main.backgroundTwo};
		color: ${({ theme }) => theme.main.textOne};
	}
`;

const Breadcrumb = styled.div`
	font-family: "DM Sans", sans-serif;
	font-size: 13px;
	color: ${({ theme }) => theme.main.placeholder};

	span {
		color: ${({ theme }) => theme.main.textOne};
		font-weight: 600;
	}
`;

const Content = styled.div`
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
`;

export default { Wrapper, Header, BackButton, Breadcrumb, Content };
