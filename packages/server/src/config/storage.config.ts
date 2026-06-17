import fs from "fs";
import path from "path";
import { Request } from "express";
import multer from "multer";

const allowedExtensions = new Set(["mp3", "wav", "jpg", "jpeg", "png"]);
const allowedMimePrefixes = ["audio/", "image/"];

export const uploadDir = path.resolve(process.env.UPLOAD_DIR || "data/uploads");

export function ensureUploadDir(): void {
	fs.mkdirSync(uploadDir, { recursive: true });
}

function sanitizeBaseName(value: string): string {
	return value
		.replace(/\.[^/.]+$/, "")
		.replace(/[^a-zA-Z0-9-_]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "") || "file";
}

export const storage = multer.diskStorage({
	destination: (_req, _file, callback) => {
		ensureUploadDir();
		callback(null, uploadDir);
	},
	filename: (_req, file, callback) => {
		const extension = path.extname(file.originalname).toLowerCase();
		const baseName = sanitizeBaseName(file.originalname);
		callback(null, `${baseName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
	},
});

export function fileFilter(
	_req: Request,
	file: Express.Multer.File,
	callback: multer.FileFilterCallback
): void {
	const extension = path.extname(file.originalname).slice(1).toLowerCase();
	const hasAllowedExtension = allowedExtensions.has(extension);
	const hasAllowedMime = allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix));

	if (hasAllowedExtension && hasAllowedMime) {
		callback(null, true);
		return;
	}

	callback(new Error("UNSUPPORTED_FILE_TYPE"));
}

export function getPublicFileUrl(filename: string): string {
	const publicApiUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 8080}`;
	const apiPrefix = process.env.API_PREFIX || "/api";
	return `${publicApiUrl}${apiPrefix}/media/files/${filename}`;
}

export async function deleteUploadedFile(filePath: string): Promise<void> {
	if (!filePath) return;
	try {
		await fs.promises.unlink(filePath);
	} catch (error: any) {
		if (error?.code !== "ENOENT") {
			throw error;
		}
	}
}
