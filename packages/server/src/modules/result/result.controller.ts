import { BaseController } from "@core/base_controller";
import { Endpoints } from "src/@types";
import ResultRepository from "./result.repository";
import ResultSessionRepository from "./result-session.repository";
import authenticateToken from "@middlewares/auth.middleware";

export class ResultController extends BaseController {
  constructor() {
    super();
  }

  define_routes(): void {
    // Public endpoints - participant sessions, saved step by step.
    // Writes require the session token returned on start.
    this.router.post(Endpoints.ExperimentSessionStart, (req, res) => {
      ResultSessionRepository.start(req, res);
    });
    this.router.get(Endpoints.ExperimentSessionGet, (req, res) => {
      ResultSessionRepository.get(req, res);
    });
    this.router.put(Endpoints.ExperimentSessionStep, (req, res) => {
      ResultSessionRepository.saveStep(req, res);
    });
    this.router.post(Endpoints.ExperimentSessionResume, (req, res) => {
      ResultSessionRepository.resume(req, res);
    });
    this.router.post(Endpoints.ExperimentSessionComplete, (req, res) => {
      ResultSessionRepository.complete(req, res);
    });

    // Public endpoint - participants submit results
    this.router.post(
      Endpoints.ExperimentSubmitResult,
      (req, res) => {
        ResultRepository.submitResult(req, res);
      }
    );

    // Authenticated endpoint - researchers download results with gaze data
    this.router.get(
      Endpoints.ExperimentExportResults,
      authenticateToken,
      (req, res) => {
        ResultRepository.exportResults(req, res);
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
