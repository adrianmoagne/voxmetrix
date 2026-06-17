import { useI18nContext } from "@/i18n/i18n-react";
import type { StoreState } from "@/store";
import { Box, Dropdown, Typography, useModal } from "@leux/ui";
import React from "react";
import { LogOut, Settings, User } from "react-feather";
import { useSelector } from "react-redux";
import S from "./UserControl.styles";
import { ModalId, ModalSizes, Pages } from "@/@types";
import Modals from "../Modals/Modals";
import { AuthService } from "@/api/services/AuthService";
import { useNavigate } from "react-router";

const UserControl = () => {
	const { LL } = useI18nContext();
	const { isCollapsed } = useSelector((state: StoreState) => state.sidebar);

	const user = useSelector((state: StoreState) => state.auth.user);

	return (
		<S.Wrapper isCollapsed={isCollapsed}>
			<S.Container isCollapsed={isCollapsed}>
				<User size={24} />
				{!isCollapsed && (
					<Box flex flexDirection="column" flexGap={6}>
						<Typography variant="button">{user?.username}</Typography>
						<Typography variant="overline" textColor="placeholder">
							{LL.Roles.Admin()}
						</Typography>
					</Box>
				)}
			</S.Container>
		</S.Wrapper>
	);
};

const UserDropdown: React.FC = () => {
	const { LL } = useI18nContext();
	const { createModal } = useModal();
	const navigate = useNavigate();
	const handleSettingsClick = () => {
		createModal({
			id: ModalId.AppSettings,
			children: <Modals.AppSettingsModal />,
			title: LL.UserControl.Settings(),
			width: ModalSizes.AppSettings,
			footer: null,
		});
	};

	const handleLogout = async () => {
		try {
			await AuthService.logout();
			navigate(Pages.Login);
		} catch (err) {
			console.error("Logout failed:", err);
		}
	};

	return (
		<Dropdown.Root
			anchor={<UserControl />}
			// autoPlacement={false}
			placement="left"
			variant="outlined"
			closeOnClick
			customWrapperStyles={{
				width: "100%",
			}}
		>
			<Dropdown.Item noBreakWord onClick={handleSettingsClick}>
				<S.MenuItemRow>
					<Settings size={16} />
					<Typography textAlign="left" variant="button">
						{LL.UserControl.Settings()}
					</Typography>
				</S.MenuItemRow>
			</Dropdown.Item>
			<Dropdown.Item noBreakWord>
				<S.MenuItemRow onClick={handleLogout}>
					<LogOut size={16} />
					<Typography textAlign="left" variant="button">
						{LL.UserControl.Logout()}
					</Typography>
				</S.MenuItemRow>
			</Dropdown.Item>
		</Dropdown.Root>
	);
};

export default UserDropdown;
