import type { GenericAction, IUploadFile, MediaUploadState, MediaUploadStep } from "@/@types";
import { createSlice } from "@reduxjs/toolkit";

const initialState: MediaUploadState = {
	files: [],
	step: "upload",
};

const mediaUploadSlice = createSlice({
	name: "MediaUpload",
	initialState,
	reducers: {
		uploadFiles: (state, action: GenericAction<IUploadFile[]>) => {
			state.files = [...state.files, ...action.payload];
		},
		setFiles: (state, action: GenericAction<IUploadFile[]>) => {
			state.files = action.payload;
		},
		removeFile: (state, action: GenericAction<IUploadFile>) => {
			state.files = state.files.filter((file) => file.fileName !== action.payload.fileName);
		},
		setStep: (state, action: GenericAction<MediaUploadStep>) => {
			state.step = action.payload;
		},
		reset: (state) => {
			state.files = [];
			state.step = "upload";
		},
	},
});

export const mediaUploadActions = mediaUploadSlice.actions;

export const mediaUploadReducer = mediaUploadSlice.reducer;
