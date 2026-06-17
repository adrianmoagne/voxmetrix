import { Router } from "express";

abstract class BaseController {
	router = Router();

	constructor() {
		this.define_routes();
	}

	abstract define_routes(): void;
}

export { BaseController };
