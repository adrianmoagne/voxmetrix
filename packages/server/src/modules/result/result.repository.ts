import { Request, Response } from "express";
import { Writable } from "stream";
import { createGzip } from "zlib";
import { Types } from "mongoose";
import { throw_error } from "@utils/throw_error";
import { ResultModel, TResult } from "./result.model";
import { GazeCaptureModel } from "./gaze-capture.model";
import { attachGazeCaptures, splitGazeCaptures } from "./gaze-storage";
import { ExperimentModel } from "../experiment/experiment.model";
import { BaseRepository } from "@core/base_repository";
import { HttpException } from "@core/server";
import { enrichResultSteps } from "./result-enrichment";
import {
  isRecord,
  markParticipantCompleted,
  normalizeBrowserInfo,
  normalizeParticipant,
} from "./result-input";

/** Legacy results kept gaze inline in their steps; listings must not load it. */
const INLINE_GAZE_PROJECTION = {
  "steps.extras.gazeData": 0,
  "steps.extras.gazeCapture": 0,
};

const writeChunk = (stream: Writable, chunk: string): Promise<void> =>
  new Promise((resolve, reject) => {
    stream.write(chunk, (error) => (error ? reject(error) : resolve()));
  });

class ResultRepository extends BaseRepository<TResult> {
  constructor() {
    super(ResultModel);
  }

  // Public endpoint - submit a whole session's results at once.
  async submitResult(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultData = isRecord(req.body) ? req.body : {};

      if (!Array.isArray(resultData.steps)) {
        throw new HttpException(400, "MISSING_REQUIRED_FIELDS");
      }

      const experiment = await ExperimentModel.findById(id, { definition: 1 }).lean();
      if (!experiment) {
        throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
      }

      const participant = normalizeParticipant(resultData);
      const { steps, captures } = splitGazeCaptures(
        enrichResultSteps(resultData.steps, experiment.definition)
      );
      const resultId = new Types.ObjectId();

      // Gaze first: a result is never stored without the captures it refers to.
      if (captures.length > 0) {
        await GazeCaptureModel.insertMany(
          captures.map((capture) => ({ ...capture, result: resultId, experiment: id }))
        );
      }

      const result = await ResultModel.create({
        _id: resultId,
        experiment: id,
        status: "completed",
        participantEmail: participant.email,
        participantName: participant.name,
        participantCondition: participant.condition,
        completedAt: new Date(),
        browserInfo: normalizeBrowserInfo(resultData.browser_info ?? resultData.browserInfo),
        schemaVersion: 2,
        steps,
      }).catch(async (error) => {
        await GazeCaptureModel.deleteMany({ result: resultId });
        throw error;
      });

      // Only once the result is stored.
      await markParticipantCompleted(id, participant.email);

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

      // Completed results by default; `?status=in_progress` or `?status=all` for the rest.
      const status = req.query.status;
      const filter: Record<string, unknown> = { experiment: id };
      if (status === "in_progress") filter.status = "in_progress";
      else if (status !== "all") filter.status = { $ne: "in_progress" };

      const results = await ResultModel.find(filter, INLINE_GAZE_PROJECTION).sort({
        completedAt: -1,
        startedAt: -1,
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

  // Authenticated endpoint - stream every result, unfinished sessions included (see `status`),
  // with its gaze data as gzipped JSON.
  async exportResults(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const experiment = await ExperimentModel.findById(id);
      if (!experiment) {
        throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
      }

      if (!experiment.owner || experiment.owner.toString() !== req.user?.id) {
        throw new HttpException(403, "UNAUTHORIZED");
      }
    } catch (error) {
      throw_error(res, error);
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "application/gzip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="experiment_${id}_results.json.gz"`
    );

    const gzip = createGzip();
    gzip.pipe(res);

    try {
      // One result at a time, so memory stays at a single participant's gaze data.
      const cursor = ResultModel.find({ experiment: id })
        .sort({ completedAt: -1 })
        .lean()
        .cursor();

      let separator = "";
      await writeChunk(gzip, "[");
      for await (const result of cursor) {
        const captures = await GazeCaptureModel.find({ result: result._id }).lean();
        const document = attachGazeCaptures(result, captures);
        await writeChunk(gzip, separator + JSON.stringify(document));
        separator = ",";
      }
      gzip.end("]");
    } catch (error) {
      // Headers are sent; dropping the connection makes the download fail visibly.
      console.log(`**ERROR**: results export failed - ${error instanceof Error ? error.message : error}`);
      gzip.destroy();
      res.destroy();
    }
  }
}

export default new ResultRepository();
