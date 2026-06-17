import S from "./FormField.styles";

type Props = {
	label: string;
	hint?: string;
	children: React.ReactNode;
};

const FormField: React.FC<Props> = ({ label, hint, children }) => (
	<S.Field>
		<S.Label>{label}</S.Label>
		{children}
		{hint && <S.Hint>{hint}</S.Hint>}
	</S.Field>
);

export { S as FormFieldStyles };
export default FormField;
