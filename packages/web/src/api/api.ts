import axios, { AxiosError } from "axios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errToAxiosError(err: any): AxiosError {
	const { message, code, config, request, response } = err;

	return new AxiosError(message, code, config, request, response);
}

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
});
