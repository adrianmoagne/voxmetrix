import { FormFieldStyles as F } from "@/components/FormField";
import S from "./SettingsView.styles";

type Field = {
	label: string;
	content: React.ReactNode;
};

type Props = {
	title: string;
	fields: Field[];
};

const SettingsView: React.FC<Props> = ({ title, fields }) => (
	<S.Content>
		<S.Title>{title}</S.Title>
		{fields.map(({ label, content }) => (
			<F.Field key={label} style={{ marginBottom: 20 }}>
				<F.Label>{label}</F.Label>
				{content}
			</F.Field>
		))}
	</S.Content>
);

export { S as SettingsViewStyles };
export default SettingsView;
