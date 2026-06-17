import { Request, Response } from "express";
import { throw_error } from "@utils/throw_error";
import { FormsModel, TForms } from "./forms.model";
import { BaseRepository } from "@core/base_repository";
import { HttpException } from "@core/server";

// }

class FormsRepository extends BaseRepository<TForms> {
	constructor() {
		super(FormsModel);
	}
}

export default new FormsRepository();
