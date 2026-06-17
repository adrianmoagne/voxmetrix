import type { GenericAction, IForm, IFormCreatePayload, IFormUpdatePayload } from "@/@types";
import { FormsService } from "@/api/services/FormsService";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface FormsState {
	forms: IForm[];
	currentForm: IForm | null;
	loading: boolean;
	saving: boolean;
	deleting: boolean;
	error: string | null;
}

const initialState: FormsState = {
	forms: [],
	currentForm: null,
	loading: false,
	saving: false,
	deleting: false,
	error: null,
};

export const fetchForms = createAsyncThunk("forms/fetchForms", async () => {
	const res = await FormsService.fetchAllForms();
	return res.data;
});

export const fetchFormById = createAsyncThunk("forms/fetchFormById", async (formId: string) => {
	const res = await FormsService.fetchFormById(formId);
	return res.data;
});

export const createForm = createAsyncThunk(
	"forms/createForm",
	async (payload: IFormCreatePayload) => {
		const res = await FormsService.createForm(payload);
		return res.data;
	}
);

export const updateForm = createAsyncThunk(
	"forms/updateForm",
	async ({ formId, payload }: { formId: string; payload: IFormUpdatePayload }) => {
		const res = await FormsService.updateForm(formId, payload);
		return res.data;
	}
);

export const deleteForm = createAsyncThunk("forms/deleteForm", async (formId: string) => {
	await FormsService.deleteFormById(formId);
	return formId;
});

const FormsSlice = createSlice({
	name: "Forms",
	initialState,
	reducers: {
		setForms(state, action: GenericAction<IForm[]>) {
			state.forms = action.payload;
		},
		setCurrentForm(state, action: GenericAction<IForm | null>) {
			state.currentForm = action.payload;
		},
		clearCurrentForm(state) {
			state.currentForm = null;
		},
		clearError(state) {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch all forms
			.addCase(fetchForms.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchForms.fulfilled, (state, action) => {
				state.loading = false;
				state.forms = Array.isArray(action.payload) ? action.payload : [];
			})
			.addCase(fetchForms.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error?.message ?? "Failed to fetch forms";
			})
			// Fetch form by ID
			.addCase(fetchFormById.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchFormById.fulfilled, (state, action) => {
				state.loading = false;
				state.currentForm = action.payload;
			})
			.addCase(fetchFormById.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error?.message ?? "Failed to fetch form";
			})
			// Create form
			.addCase(createForm.pending, (state) => {
				state.saving = true;
				state.error = null;
			})
			.addCase(createForm.fulfilled, (state, action) => {
				state.saving = false;
				const newForm = action.payload?.content || action.payload?.data || action.payload;
				state.forms = [...(state.forms || []), newForm];
				state.currentForm = newForm;
			})
			.addCase(createForm.rejected, (state, action) => {
				state.saving = false;
				state.error = action.error?.message ?? "Failed to create form";
			})
			// Update form
			.addCase(updateForm.pending, (state) => {
				state.saving = true;
				state.error = null;
			})
			.addCase(updateForm.fulfilled, (state, action) => {
				state.saving = false;
				const updatedForm = action.payload?.content || action.payload?.data || action.payload;
				state.forms = (state.forms || []).map((form) =>
					form._id === updatedForm._id ? updatedForm : form
				);
				state.currentForm = updatedForm;
			})
			.addCase(updateForm.rejected, (state, action) => {
				state.saving = false;
				state.error = action.error?.message ?? "Failed to update form";
			})
			// Delete form
			.addCase(deleteForm.pending, (state) => {
				state.deleting = true;
				state.error = null;
			})
			.addCase(deleteForm.fulfilled, (state, action) => {
				state.deleting = false;
				const formId = action.payload;
				state.forms = state.forms.filter((form) => form._id !== formId);
				if (state.currentForm?._id === formId) {
					state.currentForm = null;
				}
			})
			.addCase(deleteForm.rejected, (state, action) => {
				state.deleting = false;
				state.error = action.error?.message ?? "Failed to delete form";
			});
	},
});

export const formsActions = {
	...FormsSlice.actions,
	fetchForms,
	fetchFormById,
	createForm,
	updateForm,
	deleteForm,
};

export const formsReducer = FormsSlice.reducer;
