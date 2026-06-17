import { BaseController } from "@core/base_controller";
import { Endpoints } from "src/@types";
import ResultRepository from "./result.repository";
import authenticateToken from "@middlewares/auth.middleware";

export class ResultController extends BaseController {
  constructor() {
    super();
  }

  define_routes(): void {
    // Public endpoint - participants submit results
    this.router.post(
      Endpoints.ExperimentSubmitResult,
      (req, res) => {
        ResultRepository.submitResult(req, res);
      }
    );

    // Authenticated endpoint - researchers get results
    this.router.get(
      Endpoints.ExperimentGetResults,
      authenticateToken,
      (req, res) => {
        ResultRepository.getResultsByExperiment(req, res);
      }
    );
  }
}
