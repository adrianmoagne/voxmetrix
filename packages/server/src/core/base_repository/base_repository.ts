import { Model } from "mongoose";
import { Request, Response } from "express";
import { throw_error } from "@utils/throw_error";
import { HttpException } from "@core/server";

export default class BaseRepository<T> {
	constructor(private readonly model: Model<T>) {}

	async create(req: Request, res: Response) {
		try {
			const payload: T = req.body;
			const doc = await this.model.create(payload);
			res.status(201).json({ content: doc });
		} catch (error) {
			throw_error(res, error);
		}
	}

	async list(_: Request, res: Response) {
		try {
			const docs = await this.model.find();
			res.status(200).json(docs);
		} catch (error) {
			throw_error(res, error);
		}
	}
	// get by id
	async get(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const doc = await this.model.findById(id);
			if (!doc) throw new HttpException(404, "USER_NOT_FOUND");
			// Assert doc is not unknown for TypeScript
			res.status(200).json(doc);
		} catch (err) {
			throw_error(res, err);
		}
	}

	/** PATCH /:id – update by ID */
	async update(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { _id, owner, createdAt, updatedAt, __v, ...safeBody } = req.body;
			const updated = await this.model.findByIdAndUpdate(id, safeBody, {
				new: true,
				runValidators: true,
			});
			if (!updated) throw new HttpException(404, "USER_NOT_FOUND");
			res.status(200).json({ content: updated });
		} catch (err) {
			throw_error(res, err);
		}
	}

	/** DELETE /:id – remove by ID */
	async remove(req: Request, res: Response) {
		try {
			const { id } = req.params;
			console.log(id);
			const deleted = await this.model.findByIdAndDelete(id);
			if (!deleted) throw new HttpException(404, "USER_NOT_FOUND");
			res.status(204).send(); // No-Content
		} catch (err) {
			throw_error(res, err);
		}
	}
}

export { BaseRepository };
