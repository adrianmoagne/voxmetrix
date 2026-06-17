import { BaseController } from "@core/base_controller";
import { Endpoints } from "src/@types";
import AdminRepository from "./admin.repository";
import authenticateToken from "@middlewares/auth.middleware";
export class AdminController extends BaseController {
	constructor() {
		super();
	}
	define_routes(): void {
		this.router.get(Endpoints.AdminbyId, authenticateToken, (req, res) => {
			AdminRepository.getAdminById(req, res);
		});
	}
}
