import { BaseController } from "@core/base_controller";
import { Endpoints } from "src/@types";
import ScreenRepository from "./screen.repository";
import authenticateToken from "@middlewares/auth.middleware";

export class ScreenController extends BaseController {
	constructor() {
		super();
	}
	define_routes(): void {
		this.router.post(Endpoints.ScreenCreate, authenticateToken, (req, res) => {
			ScreenRepository.create(req, res);
		});

		this.router.get(Endpoints.ScreenList, authenticateToken, (req, res) => {
			ScreenRepository.list(req, res);
		});

		this.router.get(Endpoints.ScreenListById, authenticateToken, (req, res) => {
			ScreenRepository.get(req, res);
		});

		this.router.delete(Endpoints.ScreenDelete, authenticateToken, (req, res) => {
			ScreenRepository.remove(req, res);
		});

		this.router.post(Endpoints.ScreenFromTemplate, authenticateToken, (req, res) => {
			ScreenRepository.from_template(req, res);
		});
	}
}
