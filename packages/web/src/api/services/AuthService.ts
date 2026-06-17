import type { AxiosResponse } from "axios";
import { api } from "../api";
import { Endpoints } from "../endpoints";
import type { IUser } from "@/@types";

const login = async (email: string, password: string): Promise<AxiosResponse> => {
	const res = await api.post(Endpoints.Login, { email, password });
	return res;
};

const logout = async (): Promise<AxiosResponse> => {
	const res = await api.post(Endpoints.Logout);
	return res;
};

const getCurrentUser = async (): Promise<AxiosResponse<IUser>> => {
	const res = await api.get(Endpoints.CurrentUser);
	return res as AxiosResponse<IUser>;
};

const register = async (
	email: string,
	password: string,
	username: string,
	name: string,
	institution: string,
	phone: string,
	description: string
): Promise<AxiosResponse> => {
	const res = await api.post(Endpoints.Register, {
		mail: email,
		password,
		username,
		name,
		institution,
		phone,
		description,
	});
	return res;
};

export const AuthService = {
	login,
	logout,
	getCurrentUser,
	register,
};
