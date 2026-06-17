import type { GenericAction, IScreen } from "@/@types";
import { createSlice } from "@reduxjs/toolkit";

export interface TemplateViewerState {
	selectedTemplate: IScreen | null;
	selectedIndex: number;
	templates: IScreen[];
}

const initialState: TemplateViewerState = {
	selectedTemplate: null,
	selectedIndex: 0,
	templates: [],
};

const templateViewerSlice = createSlice({
	name: "TemplateViewer",
	initialState,
	reducers: {
		setSelectedTemplate: (
			state,
			action: GenericAction<TemplateViewerState["selectedTemplate"]>
		) => {
			state.selectedTemplate = action.payload;
		},
		setSelectedIndex: (state, action: GenericAction<TemplateViewerState["selectedIndex"]>) => {
			state.selectedIndex = action.payload;
		},
		setTemplates: (state, action: GenericAction<TemplateViewerState["templates"]>) => {
			state.templates = action.payload;
		},
	},
});
export const templateViewerReducer = templateViewerSlice.reducer;
export const templateViewerActions = templateViewerSlice.actions;
