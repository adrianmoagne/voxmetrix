import { BaseController } from "@core/base_controller";
import { Endpoints } from "src/@types";
import ProjectRepository from "./project.repository";
import authenticateToken from "@middlewares/auth.middleware";

export class ProjectController extends BaseController {
	constructor() {
		super();
	}
	define_routes(): void {
		this.router.post(Endpoints.ProjectCreate, authenticateToken, (req, res) => {
			ProjectRepository.create(req, res);
		});

		this.router.get(Endpoints.ProjectList, authenticateToken, (req, res) => {
			ProjectRepository.getProjects(req, res);
		});

		this.router.delete(Endpoints.ProjectDelete, authenticateToken, (req, res) => {
			ProjectRepository.remove(req, res);
		});
	}
}
