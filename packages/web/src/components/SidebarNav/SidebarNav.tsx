import { Pages, type SidebarNavItem } from "@/@types";
import { useI18nContext } from "@/i18n/i18n-react";
import { Typography } from "@leux/ui";
import { Edit, Folder, Image, Tool } from "react-feather";
import { useLocation, useNavigate } from "react-router";
import S from "./SidebarNav.styles";
import { useSelector } from "react-redux";
import type { StoreState } from "@/store";

const items: SidebarNavItem[] = [
	{
		path: Pages.Projects,
		label: "Projects",
		icon: <Folder strokeWidth={1.5} className="icon" />,
	},
	{
		path: Pages.Medias,
		label: "Medias",
		icon: <Image strokeWidth={1.5} className="icon" />,
	},
	{
		path: Pages.Forms,
		label: "Forms",
		icon: <Edit strokeWidth={1.5} className="icon" />,
	},
	{
		path: Pages.Builder,
		label: "Build",
		icon: <Tool strokeWidth={1.5} className="icon" />,
	},
];

const SidebarNav: React.FC = () => {
	const { LL } = useI18nContext();
	const { isCollapsed } = useSelector((state: StoreState) => state.sidebar);

	const { pathname } = useLocation();
	const navigate = useNavigate();

	const goTo = (path: string) => {
		navigate(path);
	};

	const isActive = (key: string) => {
		return key === pathname;
	};

	return (
		<S.Menu>
			{items.map((item) => (
				<S.MenuItem
					key={item.path}
					isActive={isActive(item.path)}
					onClick={() => goTo(item.path)}
					isCollapsed={isCollapsed}
				>
					{item.icon}
					{!isCollapsed && <Typography variant="button">{LL.Sidebar.Nav[item.label]()}</Typography>}
				</S.MenuItem>
			))}
		</S.Menu>
	);
};

export default SidebarNav;
