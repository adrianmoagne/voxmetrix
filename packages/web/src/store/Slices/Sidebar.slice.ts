import { LocalStorageKeys, type SidebarState } from "@/@types";
import { createSlice } from "@reduxjs/toolkit";

const initialState: SidebarState = {
	isCollapsed: false,
};

const SidebarSlice = createSlice({
	name: "Sidebar",
	initialState: initialState,
	reducers: {
		toggleSidebar(state) {
			localStorage.setItem(
				LocalStorageKeys.SidebarCollapsed,
				!state.isCollapsed ? "true" : "false"
			);
			state.isCollapsed = !state.isCollapsed;
		},
		getPersistedSidebarState(state) {
			const collapsed = localStorage.getItem(LocalStorageKeys.SidebarCollapsed);
			const isCollapsedValue = collapsed === "true";

			if (isCollapsedValue !== state.isCollapsed) {
				state.isCollapsed = isCollapsedValue;
			}
		},
	},
});

export const sidebarActions = SidebarSlice.actions;
export const sidebarReducer = SidebarSlice.reducer;
