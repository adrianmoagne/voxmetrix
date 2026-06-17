import { createSlice } from "@reduxjs/toolkit";
import type { GenericAction } from "@/@types";
import type {
	GridType,
	GridSubtype,
	ScreenChildEntity,
	ScreenBehaviorEntity,
	ScreenEntity,
	Placement,
} from "@/@types/screen.model";
import { getItemPositionFromMap, getPositionsMap } from "@/utils/gridPositions";

export interface ScreenEntityEditorState {
	screenUid: string;
	name: string;
	gridType: GridType;
	gridSubtype: GridSubtype;
	children: ScreenChildEntity[];
	behaviors: ScreenBehaviorEntity[];
}

const cloneChildren = (children: ScreenChildEntity[]): ScreenChildEntity[] =>
	structuredClone(children);

const cloneBehaviors = (behaviors: ScreenBehaviorEntity[]): ScreenBehaviorEntity[] =>
	structuredClone(behaviors);

const normalizePlacementForGrid = (placement: Placement, gridType: GridType): Placement => {
	const currentColumn = getPositionsMap(placement.position).position;

	if (gridType === "3x3") {
		return placement;
	}

	if (gridType === "1x1") {
		return {
			...placement,
			position: getItemPositionFromMap(placement.area, "center"),
		};
	}

	const normalizedArea = placement.area === "heading" ? "heading" : "footer";
	const normalizedColumn = currentColumn === "left" ? "left" : "right";

	return {
		...placement,
		area: normalizedArea,
		position: getItemPositionFromMap(normalizedArea, normalizedColumn),
	};
};

const initialState: ScreenEntityEditorState = {
	screenUid: "",
	name: "",
	gridType: "3x3",
	gridSubtype: "equal",
	children: [],
	behaviors: [],
};

const screenEntityEditorSlice = createSlice({
	name: "screenEntityEditor",
	initialState,
	reducers: {
		loadScreen: (state, action: GenericAction<ScreenEntity>) => {
			const screen = action.payload;
			state.screenUid = screen.uid;
			state.name = screen.name;
			state.gridType = screen.props.grid.type;
			state.gridSubtype = screen.props.grid.subtype;
			state.children = cloneChildren(screen.children);
			state.behaviors = cloneBehaviors(screen.behaviors ?? []);
		},
		setGridType: (state, action: GenericAction<GridType>) => {
			state.gridType = action.payload;
			state.children = state.children.map((child) => ({
				...child,
				placement: normalizePlacementForGrid(child.placement, action.payload),
			}));
		},
		setGridSubtype: (state, action: GenericAction<GridSubtype>) => {
			state.gridSubtype = action.payload;
		},
		setName: (state, action: GenericAction<string>) => {
			state.name = action.payload;
		},
		addChild: (state, action: GenericAction<ScreenChildEntity>) => {
			state.children.push(structuredClone(action.payload));
		},
		removeChild: (state, action: GenericAction<string>) => {
			state.children = state.children.filter((c) => c.uid !== action.payload);
		},
		updateChildName: (state, action: GenericAction<{ uid: string; name: string }>) => {
			const child = state.children.find((c) => c.uid === action.payload.uid);
			if (child) child.name = action.payload.name;
		},
		updateChildProps: (
			state,
			action: GenericAction<{ uid: string; props: Record<string, unknown> }>
		) => {
			const child = state.children.find((c) => c.uid === action.payload.uid);
			if (child) Object.assign(child.props, action.payload.props);
		},
		updateChildPlacement: (
			state,
			action: GenericAction<{ uid: string; placement: Partial<Placement> }>
		) => {
			const child = state.children.find((c) => c.uid === action.payload.uid);
			if (child) Object.assign(child.placement, action.payload.placement);
		},
		addBehavior: (state, action: GenericAction<ScreenBehaviorEntity>) => {
			if (!state.behaviors.some((b) => b.kind === action.payload.kind)) {
				state.behaviors.push(structuredClone(action.payload));
			}
		},
		removeBehavior: (state, action: GenericAction<string>) => {
			state.behaviors = state.behaviors.filter((b) => b.uid !== action.payload);
		},
		updateBehaviorProps: (
			state,
			action: GenericAction<{ uid: string; props: Record<string, unknown> }>
		) => {
			const behavior = state.behaviors.find((b) => b.uid === action.payload.uid);
			if (behavior) Object.assign(behavior.props, action.payload.props);
		},
		reset: () => initialState,
	},
});

export const screenEntityEditorActions = screenEntityEditorSlice.actions;
export const screenEntityEditorReducer = screenEntityEditorSlice.reducer;
