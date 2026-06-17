import type { AxiosProgressEvent, AxiosResponse } from "axios";
import { api } from "../api";
import { Endpoints } from "../endpoints";

const fetchAllMedia = async (): Promise<AxiosResponse> => {
	const res = await api.get(Endpoints.Media);
	return res.data;
};

const uploadMedia = async (
	media: FormData,
	onProgress: (progressEvent: AxiosProgressEvent) => void
): Promise<AxiosResponse> => {
	const res = await api.post(Endpoints.Media, media, {
		onUploadProgress: onProgress,
	});
	return res;
};

export const MediaService = {
	fetchAllMedia,
	uploadMedia,
};
