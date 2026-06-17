import { createSlice } from "@reduxjs/toolkit";
import type { GenericAction, IScreen } from "@/@types";

export interface SetupNewScreenState {
	selectedType: "blank" | "template" | null;
	selectedTemplate: IScreen | null;
}

const initialState: SetupNewScreenState = {
	selectedType: null,
	selectedTemplate: null,
};

const setupNewScreenSlice = createSlice({
	name: "SetupNewScreen",
	initialState,
	reducers: {
		setSelectedType: (state, action: GenericAction<SetupNewScreenState["selectedType"]>) => {
			state.selectedType = action.payload;
			if (action.payload === "blank") {
				state.selectedTemplate = null;
			}
		},
		setSelectedTemplate: (state, action: GenericAction<IScreen | null>) => {
			state.selectedTemplate = action.payload;
			state.selectedType = action.payload ? "template" : state.selectedType;
		},
		reset: (state) => {
			state.selectedType = null;
			state.selectedTemplate = null;
		},
	},
});

export const setupNewScreenActions = setupNewScreenSlice.actions;
export const setupNewScreenReducer = setupNewScreenSlice.reducer;
