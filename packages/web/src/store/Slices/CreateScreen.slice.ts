import type { GenericAction, ScreenItem, ScreenState } from "@/@types";
import type { ScreenComponent } from "@/@types/screen.model";
import { createSlice } from "@reduxjs/toolkit";

interface CreateScreenState extends ScreenState {
	components: ScreenComponent[];
}

const initialState: CreateScreenState = {
	gridType: "3x3",
	gridSubtype: "equal",
	items: [],
	enable_tracking: false,
	components: [],
};

const createScreenSlice = createSlice({
	name: "CreateScreen",
	initialState,
	reducers: {
		setGridType: (state, action: GenericAction<ScreenState["gridType"]>) => {
			state.gridType = action.payload;
		},
		setGridSubtype: (state, action: GenericAction<ScreenState["gridSubtype"]>) => {
			state.gridSubtype = action.payload;
		},
		setEnableTracking: (state, action: GenericAction<ScreenState["enable_tracking"]>) => {
			state.enable_tracking = action.payload;
		},
		addItem: (state, action: GenericAction<ScreenItem>) => {
			state.items.push(action.payload);
		},
		removeItem: (state, action: GenericAction<string>) => {
			state.items = state.items.filter((item) => item._id !== action.payload);
		},
		updateItem: (state, action: GenericAction<Partial<ScreenItem> & { _id: string }>) => {
			const item = state.items.find((i) => i._id === action.payload._id);
			if (item) Object.assign(item, action.payload);
		},
		addComponent: (state, action: GenericAction<ScreenComponent>) => {
			// Prevent duplicates by type
			if (!state.components.some((c) => c.type === action.payload.type)) {
				state.components.push(action.payload);
			}
		},
		removeComponent: (state, action: GenericAction<ScreenComponent["type"]>) => {
			state.components = state.components.filter((c) => c.type !== action.payload);
		},
		updateComponentConfig: (state, action: GenericAction<{ type: ScreenComponent["type"]; config: Record<string, unknown> }>) => {
			const comp = state.components.find((c) => c.type === action.payload.type);
			if (comp) {
				comp.config = { ...comp.config, ...action.payload.config };
			}
		},
		setComponents: (state, action: GenericAction<ScreenComponent[]>) => {
			state.components = action.payload;
		},
		reset: (state) => {
			state.gridType = initialState.gridType;
			state.gridSubtype = initialState.gridSubtype;
			state.items = [];
			state.enable_tracking = initialState.enable_tracking;
			state.components = [];
		},
	},
});

export const createScreenActions = createScreenSlice.actions;

export const createScreenReducer = createScreenSlice.reducer;
