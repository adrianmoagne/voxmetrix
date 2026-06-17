import type { AuthState, GenericAction, IUser } from "@/@types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AuthService } from "@/api/services/AuthService";

const initialState: AuthState = {
	user: null,
	loading: false,
	error: null,
};

export const fetchCurrentUser = createAsyncThunk("auth/fetchCurrentUser", async () => {
	const res = await AuthService.getCurrentUser();
	return res.data as IUser;
});

const AuthSlice = createSlice({
	name: "Auth",
	initialState,
	reducers: {
		setUser(state, action: GenericAction<IUser | null>) {
			state.user = action.payload;
		},
		clearUser(state) {
			state.user = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCurrentUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCurrentUser.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload;
			})
			.addCase(fetchCurrentUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error?.message ?? "Failed to fetch current user";
			});
	},
});

export const authActions = { ...AuthSlice.actions, fetchCurrentUser };
export const authReducer = AuthSlice.reducer;
