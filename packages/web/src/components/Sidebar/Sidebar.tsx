import Logo from "../Logo/Logo";
import S from "./Sidebar.styles";

import { sidebarActions, type StoreState } from "@/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Icons from "../Icons/Icons";
import SidebarNav from "../SidebarNav/SidebarNav";
import SidebarSearch from "../SidebarSearch/SidebarSearch";
import UserControl from "../UserControl/UserControl";

const Sidebar: React.FC = () => {
	const { isCollapsed } = useSelector((state: StoreState) => state.sidebar);
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch(sidebarActions.getPersistedSidebarState());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const toggleSidebar = () => {
		dispatch(sidebarActions.toggleSidebar());
	};

	return (
		<S.Sidebar isCollapsed={isCollapsed}>
			<S.Column>
				<S.Header isCollapsed={isCollapsed}>
					<S.CollapseWrapper onClick={toggleSidebar} isCollapsed={isCollapsed}>
						{!isCollapsed ? (
							<Icons.CollapseIcon width="24" height="24" />
						) : (
							<Icons.ExpandIcon width="24" height="24" />
						)}
					</S.CollapseWrapper>
					<div
						style={{
							opacity: isCollapsed ? 0 : 1,
							transition: "opacity 0.2s ease-in-out",
						}}
					>
						<Logo />
					</div>
					<SidebarSearch />
				</S.Header>
				<SidebarNav />
			</S.Column>
			<UserControl />
		</S.Sidebar>
	);
};

export default Sidebar;
