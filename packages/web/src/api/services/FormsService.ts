import type { AxiosResponse } from "axios";
import { api } from "../api";
import { Endpoints } from "../endpoints";
import type { IFormCreatePayload, IFormUpdatePayload } from "@/@types";

const fetchAllForms = async (): Promise<AxiosResponse> => {
	const res = await api.get(Endpoints.Forms);
	return res;
};

const fetchFormById = async (formId: string): Promise<AxiosResponse> => {
	const res = await api.get(Endpoints.FormById.replace(":id", formId));
	return res;
};

const createForm = async (payload: IFormCreatePayload): Promise<AxiosResponse> => {
	const res = await api.post(Endpoints.Forms, payload);
	return res;
};

const updateForm = async (formId: string, payload: IFormUpdatePayload): Promise<AxiosResponse> => {
	const res = await api.patch(Endpoints.FormById.replace(":id", formId), payload);
	return res;
};

const deleteFormById = async (formId: string): Promise<AxiosResponse> => {
	const res = await api.delete(Endpoints.FormById.replace(":id", formId));
	return res;
};

export const FormsService = {
	fetchAllForms,
	fetchFormById,
	createForm,
	updateForm,
	deleteFormById,
};
