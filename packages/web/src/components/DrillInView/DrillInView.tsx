import { ArrowLeft } from "react-feather";
import S from "./DrillInView.styles";

type Props = {
	onBack: () => void;
	breadcrumb: React.ReactNode;
	children: React.ReactNode;
};

const DrillInView: React.FC<Props> = ({ onBack, breadcrumb, children }) => (
	<S.Wrapper>
		<S.Header>
			<S.BackButton onClick={onBack}>
				<ArrowLeft size={12} />
				Back
			</S.BackButton>
			<S.Breadcrumb>{breadcrumb}</S.Breadcrumb>
		</S.Header>
		<S.Content>{children}</S.Content>
	</S.Wrapper>
);

export default DrillInView;
