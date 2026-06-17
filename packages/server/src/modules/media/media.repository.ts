import { Request, Response } from "express";
import { throw_error } from "@utils/throw_error";
import { MediaModel, TMedia } from "./media.model";
import { Types } from "mongoose";
import { BaseRepository } from "@core/base_repository";
import { HttpException } from "@core/server";
import { Upload } from "@decorators/upload.decorator";
import { TUploadedFile } from "../../@types/files.model";
import { getPublicFileUrl } from "@config/storage.config";

class MediaRepository extends BaseRepository<TMedia> {
	constructor() {
		super(MediaModel);
	}
	@Upload({ multiple: true, field: "files" })
	async create(req: Request, res: Response) {
		try {
			const files = req.files as TUploadedFile[];
			if (!files || files.length === 0) {
				throw new HttpException(400, "NO_FILE_UPLOADED");
			}

			const getMediaType = (mimetype: string) => {
				if (mimetype.startsWith("image/")) return "picture";
				if (mimetype.startsWith("audio/")) return "audio";
				return null;
			};
			const mediaTypes = files.map((file) => getMediaType(file.mimetype));
			if (mediaTypes.includes(null)) {
				throw new HttpException(400, "UNSUPPORTED_FILE_TYPE");
			}

			const media = await Promise.all(
				files.map((file) =>
					MediaModel.create({
						alias: file.originalname,
						type: mediaTypes[files.indexOf(file)] as "audio" | "picture",
						src: getPublicFileUrl(file.filename),
						filename: file.filename,
						original_name: file.originalname,
						owner: req.user?.id,
						extension: file.mimetype ? file.mimetype.split("/")[1] : "unknown",
						size: file.size,
					})
				)
			);

			res.status(201).json({
				success: true,
				data: files,
			});
		} catch (error: any) {
			res.status(error.statusCode || 500).json({
				success: false,
				message: error.message || "Error uploading file",
			});
		}
	}

	async getMyMedia(req: Request, res: Response) {
		try {
			const userId = req.user?.id; // from auth middleware
			console.log("User ID from token:", userId);
			if (!userId) {
				throw new HttpException(401, "UNAUTHORIZED");
			}

			const media = await MediaModel.find({ owner: userId })
				.sort({ created_at: -1 })
				.lean();

			console.log(`Found ${media.length} media items for user ${userId}`);

			res.status(200).json({
				success: true,
				count: media.length,
				data: media,
			});
		} catch (error: any) {
			throw_error(res, error);
		}
	}
}

export default new MediaRepository();
