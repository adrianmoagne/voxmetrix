import type { GenericAction, IProject } from "@/@types";
import type { ExperimentDefinition } from "@/@types/screen.model";
import { ProjectService } from "@/api/services/ProjectService";
import { ExperimentService } from "@/api/services/ExperimentService";
import { cloneExperimentDefinition } from "@/utils/cloneExperimentDefinition";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface ProjectState {
	projects: IProject[];
	loading: boolean;
	deleting: boolean;
	duplicating: boolean;
	error: string | null;
}
const initialState: ProjectState = {
	projects: [],
	loading: false,
	deleting: false,
	duplicating: false,
	error: null,
};

export const fetchProjects = createAsyncThunk("project/fetchProjects", async () => {
	const res = await ProjectService.fetchAllProjects();
	return res.data;
});

export const createProject = createAsyncThunk(
	"project/createProject",
	async ({ alias, description }: { alias: string; description: string }) => {
		const res = await ProjectService.createProject({ alias, description });
		return res.data;
	}
);

export const deleteExperiment = createAsyncThunk(
	"project/deleteExperiment",
	async (experimentId: string) => {
		await ExperimentService.deleteExperimentById(experimentId);
		return experimentId;
	}
);

export const duplicateExperiment = createAsyncThunk(
	"project/duplicateExperiment",
	async (
		{ experimentId, projectId }: { experimentId: string; projectId: string },
		{ dispatch }
	) => {
		const res = await ExperimentService.fetchExperimentById(experimentId);
		const definition = res.data?.data?.definition as ExperimentDefinition | undefined;
		if (!definition) {
			throw new Error("Experiment definition not found");
		}

		const cloned = cloneExperimentDefinition(definition);
		const createRes = await ExperimentService.createExperiment({
			alias: cloned.name,
			description: cloned.description,
			status: "draft",
			project_id: projectId,
			definition: cloned,
		});

		const newId = createRes.data?.content?.id;
		if (!newId) {
			throw new Error("Failed to create experiment copy");
		}

		await dispatch(fetchProjects());
		return { newId: String(newId), projectId };
	}
);

export const deleteProject = createAsyncThunk(
	"project/deleteProject",
	async (projectId: string) => {
		await ProjectService.deleteProjectById(projectId);
		return projectId;
	}
);

const ProjectSlice = createSlice({
	name: "Project",
	initialState,
	reducers: {
		setProjects(state, action: GenericAction<IProject[]>) {
			state.projects = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProjects.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchProjects.fulfilled, (state, action) => {
				state.loading = false;
				state.projects = action.payload;
			})
			.addCase(fetchProjects.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error?.message ?? "Failed to fetch projects";
			})
			.addCase(createProject.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createProject.fulfilled, (state, action) => {
				state.loading = false;
				state.projects = [...state.projects, action.payload.data];
			})
			.addCase(createProject.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error?.message ?? "Failed to create project";
			})
			.addCase(deleteExperiment.pending, (state) => {
				state.deleting = true;
				state.error = null;
			})
			.addCase(deleteExperiment.fulfilled, (state, action) => {
				state.deleting = false;
				const experimentId = action.payload;
				state.projects = state.projects.map((project) => ({
					...project,
					experiments: project.experiments.filter((exp) => exp._id !== experimentId),
				}));
			})
			.addCase(deleteExperiment.rejected, (state, action) => {
				state.deleting = false;
				state.error = action.error?.message ?? "Failed to delete experiment";
			})
			.addCase(duplicateExperiment.pending, (state) => {
				state.duplicating = true;
				state.error = null;
			})
			.addCase(duplicateExperiment.fulfilled, (state) => {
				state.duplicating = false;
			})
			.addCase(duplicateExperiment.rejected, (state, action) => {
				state.duplicating = false;
				state.error = action.error?.message ?? "Failed to duplicate experiment";
			})
			.addCase(deleteProject.pending, (state) => {
				state.deleting = true;
				state.error = null;
			})
			.addCase(deleteProject.fulfilled, (state, action) => {
				state.deleting = false;
				const projectId = action.payload;
				state.projects = state.projects.filter((project) => project._id !== projectId);
			})
			.addCase(deleteProject.rejected, (state, action) => {
				state.deleting = false;
				state.error = action.error?.message ?? "Failed to delete project";
			});
	},
});

export const projectActions = {
	...ProjectSlice.actions,
	fetchProjects,
	createProject,
	deleteExperiment,
	duplicateExperiment,
	deleteProject,
};
export const projectReducer = ProjectSlice.reducer;
