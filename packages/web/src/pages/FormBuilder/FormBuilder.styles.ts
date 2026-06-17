import styled from "@emotion/styled";

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 24px;
`;

const Header = styled.header`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const HeaderRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
`;

const HeaderLeft = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`;

const HeaderRight = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

const AliasInput = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;

	input {
		background: transparent;
		border: none;
		font-size: 14px;
		font-weight: 500;
		color: ${({ theme }) => theme.main.textOne};
		padding: 4px 8px;
		border-radius: 4px;

		&:hover {
			background: ${({ theme }) => theme.main.defaultGhost};
		}

		&:focus {
			outline: none;
			background: ${({ theme }) => theme.main.defaultGhost};
		}
	}
`;

const Content = styled.div`
	display: flex;
	gap: 24px;
	flex: 1;
	min-height: 0;
`;

const BuilderPanel = styled.div`
	width: 320px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-radius: 8px;
	overflow-y: auto;
`;

const BuilderSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const SectionTitle = styled.div`
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	color: ${({ theme }) => theme.main.placeholder};
`;

const FieldTypeButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	background: ${({ theme }) => theme.main.backgroundOne};
	border: 1px solid ${({ theme }) => theme.main.borderColor};
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: ${({ theme }) => theme.main.primary};
		background: ${({ theme }) => theme.main.primaryGhost};
	}

	span {
		font-size: 14px;
		color: ${({ theme }) => theme.main.textOne};
	}
`;

const PreviewPanel = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 24px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-radius: 8px;
	overflow-y: auto;
`;

const PreviewHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 16px;
	border-bottom: 1px solid ${({ theme }) => theme.main.borderColor};
`;

const FormFields = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const FormFieldWrapper = styled.div<{ isSelected?: boolean }>`
	position: relative;
	padding: 12px;
	border: 2px solid
		${({ theme, isSelected }) => (isSelected ? theme.main.primary : "transparent")};
	border-radius: 8px;
	background: ${({ theme, isSelected }) =>
		isSelected ? theme.main.primaryGhost : "transparent"};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ theme }) => theme.main.defaultGhost};
	}

	&:hover .field-actions {
		opacity: 1;
	}
`;

const FieldActions = styled.div`
	position: absolute;
	top: 8px;
	right: 8px;
	display: flex;
	gap: 4px;
	opacity: 0;
	transition: opacity 0.2s ease;
`;

const FormActionsPanel = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-radius: 8px;
`;

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 48px;
	border: 2px dashed ${({ theme }) => theme.main.borderColor};
	border-radius: 8px;
	text-align: center;
`;

const SettingsPanel = styled.div`
	width: 300px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	background: ${({ theme }) => theme.main.backgroundTwo};
	border-radius: 8px;
	overflow-y: auto;
`;

const SettingsSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const SettingsField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const OptionsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const OptionRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

export default {
	Container,
	Header,
	HeaderRow,
	HeaderLeft,
	HeaderRight,
	AliasInput,
	Content,
	BuilderPanel,
	BuilderSection,
	SectionTitle,
	FieldTypeButton,
	PreviewPanel,
	PreviewHeader,
	FormFields,
	FormFieldWrapper,
	FieldActions,
	FormActionsPanel,
	EmptyState,
	SettingsPanel,
	SettingsSection,
	SettingsField,
	OptionsContainer,
	OptionRow,
};
