import { BaseController } from "@core/base_controller";
import { Endpoints } from "src/@types";
import AuthRepository from "./auth.repository";
import authenticateToken from "@middlewares/auth.middleware";
export class AuthController extends BaseController {
	constructor() {
		super();
	}

	define_routes(): void {
		this.router.post(Endpoints.Login, (req, res) => {
			AuthRepository.login(req, res);
		});
		this.router.post(Endpoints.Register, (req, res) => {
			AuthRepository.Register(req, res);
		});
		this.router.get(Endpoints.Me, authenticateToken, AuthRepository.me);
		this.router.post(
			Endpoints.Logout,
			authenticateToken,
			AuthRepository.logout
		);
	}
}
