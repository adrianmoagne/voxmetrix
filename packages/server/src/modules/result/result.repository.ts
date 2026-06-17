import { Request, Response } from "express";
import { throw_error } from "@utils/throw_error";
import { ResultModel, TResult } from "./result.model";
import { ExperimentModel } from "../experiment/experiment.model";
import { BaseRepository } from "@core/base_repository";
import { HttpException } from "@core/server";
import { enrichResultSteps } from "./result-enrichment";

interface Viewport {
  width: number;
  height: number;
}

class ResultRepository extends BaseRepository<TResult> {
  constructor() {
    super(ResultModel);
  }

  private normalizeViewport(
    widthValue: unknown,
    heightValue: unknown
  ): Viewport | null {
    const width = Number(widthValue);
    const height = Number(heightValue);

    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      return null;
    }

    if (width <= 0 || height <= 0) {
      return null;
    }

    return { width, height };
  }

  private normalizeString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : undefined;
  }

  // Public endpoint - submit experiment results.
  async submitResult(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultData = req.body || {};
      const browserInfoInput = resultData.browser_info ?? resultData.browserInfo ?? {};
      const browserViewport = this.normalizeViewport(
        browserInfoInput.windowWidth ?? browserInfoInput.window_width,
        browserInfoInput.windowHeight ?? browserInfoInput.window_height
      );

      if (!Array.isArray(resultData.steps)) {
        throw new HttpException(400, "MISSING_REQUIRED_FIELDS");
      }

      const participantEmail = this.normalizeString(resultData.participant?.email);
      const participantName = this.normalizeString(resultData.participant?.name);
      const participantCondition = this.normalizeString(
        resultData.participantCondition ?? resultData.participant_condition
      );
      const normalizedParticipantEmail = participantEmail?.toLowerCase();

      const experiment = await ExperimentModel.findById(id);
      if (!experiment) {
        throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
      }

      if (normalizedParticipantEmail) {
        const participant = experiment.participants?.find(
          (p) => (p.email || "").trim().toLowerCase() === normalizedParticipantEmail
        );

        if (participant) {
          participant.status = "completed";
          participant.completedAt = new Date();
          await experiment.save();
        }
      }

      const result = await ResultModel.create({
        experiment: id,
        participantEmail,
        participantName,
        participantCondition,
        completedAt: new Date(),
        browserInfo: {
          userAgent: this.normalizeString(browserInfoInput.userAgent),
          windowWidth: browserViewport?.width,
          windowHeight: browserViewport?.height,
        },
        schemaVersion: 2,
        steps: enrichResultSteps(resultData.steps, experiment.definition),
      });

      res.status(201).json({
        success: true,
        message: "Result submitted successfully",
        data: { resultId: result._id },
      });
    } catch (error) {
      throw_error(res, error);
    }
  }

  // Authenticated endpoint - get results for an experiment.
  async getResultsByExperiment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const experiment = await ExperimentModel.findById(id);
      if (!experiment) {
        throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
      }

      if (!experiment.owner || experiment.owner.toString() !== req.user?.id) {
        throw new HttpException(403, "UNAUTHORIZED");
      }

      const results = await ResultModel.find({ experiment: id }).sort({
        completedAt: -1,
      });

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      throw_error(res, error);
    }
  }
}

export default new ResultRepository();
