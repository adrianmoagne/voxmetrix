import { BaseController } from "@core/base_controller";
import { Endpoints } from "src/@types";
import MediaRepository from "./media.repository";
import authenticateToken from "@middlewares/auth.middleware";

export class MediaController extends BaseController {
	constructor() {
		super();
	}
	define_routes(): void {
		this.router.post(Endpoints.MediaCreate, authenticateToken, (req, res) => {
			MediaRepository.create(req, res);
		});

		this.router.get(Endpoints.MediaList, authenticateToken, (req, res) => {
			MediaRepository.getMyMedia(req, res);
		});

		this.router.get(Endpoints.MediaListById, authenticateToken, (req, res) => {
			MediaRepository.get(req, res);
		});

		// this.router.delete(Endpoints.MediaDelete, (req, res) => {
		// 	MediaRepository.remove(req, res);
		// });
	}
}
