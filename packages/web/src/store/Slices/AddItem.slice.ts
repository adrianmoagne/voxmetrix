import type {
	GenericAction,
	ItemType,
	ItemPosition,
	ItemAlignment,
	AddItemStep,
	ScreenDraft,
	IForm,
} from "@/@types";
import { createSlice } from "@reduxjs/toolkit";

export interface AddItemState {
	step: ItemType | null;
	draft: ScreenDraft;
}

const initialState: AddItemState = {
	step: null,
	draft: {
		media: null,
		form: null,
		type: null,
		area: null,
		position: null,
		v_align: null,
		h_align: null,
		text: null,
	},
};

const addItemSlice = createSlice({
	name: "AddItem",
	initialState,
	reducers: {
		setStep: (state, action: GenericAction<AddItemStep>) => {
			state.step = action.payload;
			state.draft.type = action.payload;
		},
		setDraftMedia: (state, action: GenericAction<ScreenDraft["media"]>) => {
			state.draft.media = action.payload;
		},
		setDraftForm: (state, action: GenericAction<IForm | null>) => {
			state.draft.form = action.payload;
		},
		setDraftText: (state, action: GenericAction<ScreenDraft["text"]>) => {
			state.draft.text = action.payload;
		},
		setDraftType: (state, action: GenericAction<ScreenDraft["type"]>) => {
			state.draft.type = action.payload;
		},
		setDraftFromPosition: (state, action: GenericAction<ItemPosition>) => {
			const map: Record<
				ItemPosition,
				{ area: "heading" | "content" | "footer"; pos: "left" | "center" | "right" }
			> = {
				UL: { area: "heading", pos: "left" },
				UC: { area: "heading", pos: "center" },
				UR: { area: "heading", pos: "right" },
				CL: { area: "content", pos: "left" },
				C: { area: "content", pos: "center" },
				CR: { area: "content", pos: "right" },
				BL: { area: "footer", pos: "left" },
				BC: { area: "footer", pos: "center" },
				BR: { area: "footer", pos: "right" },
			};
			const m = map[action.payload];
			state.draft.area = m.area;
			state.draft.position = m.pos;
		},
		setDraftFromAlignment: (state, action: GenericAction<ItemAlignment>) => {
			const [v, h] = action.payload.split("-") as [
				"top" | "center" | "bottom",
				"left" | "center" | "right"
			];
			state.draft.v_align = v;
			state.draft.h_align = h;
		},
		clearDraft: (state) => {
			state.draft = {
				media: null,
				form: null,
				type: null,
				area: null,
				position: null,
				v_align: null,
				h_align: null,
				text: null,
			};
		},
		reset: (state) => {
			state.step = null;
		},
	},
});

export const addItemActions = addItemSlice.actions;

export const addItemReducer = addItemSlice.reducer;
