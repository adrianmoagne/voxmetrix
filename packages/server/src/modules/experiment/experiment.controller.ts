import { BaseController } from "@core/base_controller";
import { Endpoints } from "src/@types";
import ExperimentRepository from "./experiment.repository";
import authenticateToken from "@middlewares/auth.middleware";
export class ExperimentController extends BaseController {
	constructor() {
		super();
	}
	define_routes(): void {
		// More specific routes first (with sub-paths)
		// Public route for participants (no auth required)
		this.router.get(
			Endpoints.ExperimentPublicRun,
			(req, res) => {
				ExperimentRepository.getExperimentForParticipant(req, res);
			}
		);

		this.router.get(
			Endpoints.ExperimentShareLink,
			authenticateToken,
			(req, res) => {
				ExperimentRepository.getShareLink(req, res);
			}
		);

		this.router.get(
			Endpoints.ExperimentGetParticipants,
			authenticateToken,
			(req, res) => {
				ExperimentRepository.getParticipants(req, res);
			}
		);

		// Generic routes after
		this.router.post(
			Endpoints.ExperimentCreate,
			authenticateToken,
			(req, res) => {
				ExperimentRepository.create(req, res);
			}
		);

		this.router.get(Endpoints.ExperimentList, authenticateToken, (req, res) => {
			ExperimentRepository.list(req, res);
		});

		this.router.get(
			Endpoints.ExperimentGetById,
			authenticateToken,
			(req, res) => {
				ExperimentRepository.getExperimentById(req, res);
			}
		);

		this.router.patch(Endpoints.ExperimentUpdate, authenticateToken, (req, res) => {
			ExperimentRepository.update(req, res);
		});

		this.router.delete(Endpoints.ExperimentDelete, authenticateToken, (req, res) => {
			ExperimentRepository.remove(req, res);
		});
	}
}
