import { upload, upload_key } from "@middlewares/upload.middleware";
import { cleanupUploadedFilesOnError, throw_error } from "@utils/index";
import { Request, Response, NextFunction } from "express";

function runMulter(
	req: Request,
	res: Response,
	field: string,
	multiple: boolean
): Promise<void> {
	return new Promise((resolve, reject) => {
		const multerMiddleware = multiple
			? upload.array(field)
			: upload.single(field);
		multerMiddleware(req, res, (err: any) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
}

export function Upload(
	{ multiple, field }: { multiple: boolean; field: string } = {
		multiple: false,
		field: upload_key,
	}
) {
	return (_: object, __: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;

		descriptor.value = async function (
			req: Request,
			res: Response,
			next: NextFunction
		) {
			try {
				const defaultField = field || upload_key;
				await runMulter(req, res, defaultField, !!multiple);

				return originalMethod.apply(this, [req, res, next]);
			} catch (error) {
				console.error("Multer error:", error);
				await cleanupUploadedFilesOnError(req);
				return throw_error(res, error);
			}
		};
	};
}
