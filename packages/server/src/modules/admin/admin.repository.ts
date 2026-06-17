import { Request, Response } from "express";
import { throw_error } from "@utils/throw_error";
import { AdminModel, TAdmin } from "./admin.model";
import { BaseRepository } from "@core/base_repository";
import { HttpException } from "@core/server";

class AdminRepository extends BaseRepository<TAdmin> {
	constructor() {
		super(AdminModel);
	}

	async getAdminById(req: Request, res: Response) {
		try {
			console.log("getAdminById");
			const adminId = req.user?.id;
			if (!adminId) {
				throw new HttpException(401, "UNAUTHORIZED");
			}

			const admin = await AdminModel.findById(adminId);
			if (!admin) {
				throw new HttpException(404, "USER_NOT_FOUND");
			}

			res.status(200).json({
				name: admin.name,
				username: admin.username,
				email: admin.mail,
			});
		} catch (error) {
			throw_error(res, error);
		}
	}
}
export default new AdminRepository();
