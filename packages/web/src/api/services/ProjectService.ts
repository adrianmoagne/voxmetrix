import type { AxiosResponse } from "axios";
import { api } from "../api";
import { Endpoints } from "../endpoints";

const fetchAllProjects = async (): Promise<AxiosResponse> => {
	const res = await api.get(Endpoints.Projects);
	return res.data;
};

const createProject = async ({
	alias,
	description,
}: {
	alias: string;
	description?: string;
}): Promise<AxiosResponse> => {
	const res = await api.post(Endpoints.Projects, {
		alias,
		description,
	});
	return res;
};

const deleteProjectById = async (projectId: string): Promise<AxiosResponse> => {
	const res = await api.delete(Endpoints.ProjectById.replace(":id", projectId));
	return res;
};

export const ProjectService = {
	fetchAllProjects,
	createProject,
	deleteProjectById,
};
