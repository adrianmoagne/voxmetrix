import { deleteUploadedFile } from "@config/storage.config";
import { Request } from "express";
import { TUploadedFile } from "../@types/files.model";

export const cleanupUploadedFilesOnError = async (req: Request) => {
	if (req.file) {
		const file = req.file as TUploadedFile;
		await deleteUploadedFile(file.path);
	}

	if (req.files) {
		const files = req.files as TUploadedFile[];
		for (const file of files) {
			await deleteUploadedFile(file.path);
		}
	}
};
