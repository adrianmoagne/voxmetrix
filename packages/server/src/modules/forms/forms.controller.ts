import { BaseController } from "@core/base_controller";
import { Endpoints } from "src/@types";
import FormsRepository from "./forms.repository";
import authenticateToken from "@middlewares/auth.middleware";

export class FormsController extends BaseController {
	constructor() {
		super();
	}
	define_routes(): void {
		this.router.post(Endpoints.FormsCreate, authenticateToken, (req, res) => {
			FormsRepository.create(req, res);
		});

		this.router.get(Endpoints.FormsList, authenticateToken, (req, res) => {
			FormsRepository.list(req, res);
		});

		this.router.get(Endpoints.FormsListById, authenticateToken, (req, res) => {
			FormsRepository.get(req, res);
		});

		this.router.patch(Endpoints.FormsUpdate, authenticateToken, (req, res) => {
			FormsRepository.update(req, res);
		});

		this.router.delete(Endpoints.FormsDelete, authenticateToken, (req, res) => {
			FormsRepository.remove(req, res);
		});
	}
}
