import type { GenericAction, IMedia, IMediaFilters, MediaViewerState } from "@/@types";
import { MediaService } from "@/api/services";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState: MediaViewerState = {
	selectedMedia: null,
	medias: [],
	selectedIndex: 0,
};

export const fetchMedias = createAsyncThunk("mediaViewer/fetchMedias", async () => {
	const response = await MediaService.fetchAllMedia();
	return response.data;
});

const mediaViewerSlice = createSlice({
	name: "MediaViewer",
	initialState,
	reducers: {
		initMediaViewer: (state, action: GenericAction<IMedia[]>) => {
			state.medias = action.payload;
		},
		setMedia: (state, action: GenericAction<{ media: IMedia; index: number }>) => {
			state.selectedMedia = action.payload.media;
			state.selectedIndex = action.payload.index;
		},
		setFilters: (state, action: GenericAction<Partial<IMediaFilters>>) => {
			if (!state.filters) {
				state.filters = action.payload;
			}

			state.filters = { ...state.filters, ...action.payload };
		},
	},
	extraReducers: (builder) => {
		builder.addCase(fetchMedias.fulfilled, (state, action) => {
			state.medias = action.payload;
		});
	},
});

export const mediaViewerActions = { ...mediaViewerSlice.actions, fetchMedias };

export const mediaViewerReducer = mediaViewerSlice.reducer;
