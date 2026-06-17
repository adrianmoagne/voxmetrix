import Breadcrumbs from "../Breadcrumbs/Breadcrumbs";
import Sidebar from "../Sidebar/Sidebar";
import S from "./Entrypoint.styles";

type Props = {
	children?: React.ReactNode;
};

const Entrypoint: React.FC<Props> = ({ children }) => {
	return (
		<S.Wrapper>
			<Sidebar />
			<S.Content>
				<Breadcrumbs />
				{children}
			</S.Content>
		</S.Wrapper>
	);
};

export default Entrypoint;
