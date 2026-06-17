import type { Translation } from "@/i18n/i18n-types";

export interface SidebarNavItem {
	path: string;
	label: keyof Translation["Sidebar"]["Nav"];
	icon: React.ReactNode;
}
