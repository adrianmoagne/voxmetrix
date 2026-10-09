import { Request, Response } from "express";
import { createHash, randomBytes } from "crypto";
import { isValidObjectId } from "mongoose";
import { throw_error } from "@utils/throw_error";
import { HttpException } from "@core/server";
import { ExperimentModel } from "../experiment/experiment.model";
import { ResultModel } from "./result.model";
import { GazeCaptureModel } from "./gaze-capture.model";
import { splitGazeCaptures } from "./gaze-storage";
import { enrichResultSteps } from "./result-enrichment";
import {
  isRecord,
  markParticipantCompleted,
  normalizeBrowserInfo,
  normalizeParticipant,
} from "./result-input";

/** Header carrying the token returned when the session started. */
export const SESSION_TOKEN_HEADER = "x-session-token";

const MAX_STEPS = 5000;
const MAX_SEED = 0xffffffff;

interface PlanEntry {
  planIndex: number;
  stepUid: string;
  rowUid?: string;
}

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

const isIndex = (value: unknown, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value < max;

const normalizePlan = (value: unknown): PlanEntry[] | null => {
  if (!Array.isArray(value) || value.length > MAX_STEPS) return null;

  const plan: PlanEntry[] = [];
  for (const [index, entry] of value.entries()) {
    if (!isRecord(entry) || entry.planIndex !== index) return null;
    if (typeof entry.stepUid !== "string" || !entry.stepUid) return null;
    if (entry.rowUid !== undefined && typeof entry.rowUid !== "string") return null;
    plan.push({ planIndex: index, stepUid: entry.stepUid, rowUid: entry.rowUid });
  }
  return plan;
};

/** Saved steps up to the first gap; a resume continues after these. */
const contiguousSteps = (steps: unknown[]): unknown[] => {
  const gap = steps.findIndex((step) => !isRecord(step));
  return gap === -1 ? steps : steps.slice(0, gap);
};

const lastPlanIndex = (steps: unknown[]): number | null =>
  steps.reduce<number | null>((last, step) => {
    const planIndex = isRecord(step) ? step.planIndex : undefined;
    return isIndex(planIndex, MAX_STEPS) && (last === null || planIndex > last) ? planIndex : last;
  }, null);

class ResultSessionRepository {
  /** The session the request's token opens; 404 for a wrong id or token alike. */
  private async findSession(req: Request, projection: Record<string, 0 | 1>) {
    const { id, resultId } = req.params;
    const token = req.get(SESSION_TOKEN_HEADER);
    if (!token || !isValidObjectId(id) || !isValidObjectId(resultId)) {
      throw new HttpException(404, "SESSION_NOT_FOUND");
    }

    const session = await ResultModel.findOne(
      { _id: resultId, experiment: id, sessionTokenHash: hashToken(token) },
      projection
    ).lean();
    if (!session) {
      throw new HttpException(404, "SESSION_NOT_FOUND");
    }
    return session;
  }

  // Public endpoint - a participant starts a session; results are then saved step by step.
  async start(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = isRecord(req.body) ? req.body : {};

      if (!isValidObjectId(id) || !(await ExperimentModel.exists({ _id: id }))) {
        throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
      }

      const plan = normalizePlan(body.plan);
      if (!isIndex(body.seed, MAX_SEED + 1) || !plan) {
        throw new HttpException(400, "INVALID_SESSION_DATA");
      }

      const participant = normalizeParticipant(body);
      const token = randomBytes(32).toString("base64url");
      const result = await ResultModel.create({
        experiment: id,
        status: "in_progress",
        startedAt: new Date(),
        participantEmail: participant.email,
        participantName: participant.name,
        participantCondition: participant.condition,
        browserInfo: normalizeBrowserInfo(body.browser_info ?? body.browserInfo),
        schemaVersion: 2,
        seed: body.seed,
        plan,
        sessionTokenHash: hashToken(token),
        steps: [],
      });

      res.status(201).json({ success: true, data: { resultId: result._id, token } });
    } catch (error) {
      throw_error(res, error);
    }
  }

  // Public endpoint - what the participant's browser needs to resume.
  async get(req: Request, res: Response) {
    try {
      const session = await this.findSession(req, {
        status: 1,
        seed: 1,
        plan: 1,
        participantCondition: 1,
        participantName: 1,
        participantEmail: 1,
        steps: 1,
      });
      const saved = contiguousSteps(session.steps ?? []);

      res.status(200).json({
        success: true,
        data: {
          status: session.status ?? "completed",
          seed: session.seed,
          plan: session.plan ?? [],
          participantCondition: session.participantCondition,
          participant: { name: session.participantName, email: session.participantEmail },
          savedStepCount: saved.length,
          lastPlanIndex: lastPlanIndex(saved),
        },
      });
    } catch (error) {
      throw_error(res, error);
    }
  }

  // Public endpoint - save one step at its position; repeating the request overwrites it.
  async saveStep(req: Request, res: Response) {
    try {
      const seq = Number(req.params.seq);
      const step = isRecord(req.body) ? req.body.step : undefined;
      if (!isIndex(seq, MAX_STEPS) || !isRecord(step)) {
        throw new HttpException(400, "INVALID_STEP_DATA");
      }

      const session = await this.findSession(req, { status: 1 });
      if (session.status !== "in_progress") {
        throw new HttpException(409, "SESSION_COMPLETED");
      }

      const experiment = await ExperimentModel.findById(req.params.id, { definition: 1 }).lean();
      if (!experiment) {
        throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
      }

      const {
        steps: [storedStep],
        captures: [capture],
      } = splitGazeCaptures(enrichResultSteps([step], experiment.definition));

      // Gaze first, as in a full submission: a saved step never refers to missing gaze.
      if (capture) {
        await GazeCaptureModel.updateOne(
          { result: session._id, stepIndex: seq },
          { $set: { ...capture, stepIndex: seq, experiment: req.params.id } },
          { upsert: true }
        );
      }

      const update = await ResultModel.updateOne(
        { _id: session._id, status: "in_progress" },
        { $set: { [`steps.${seq}`]: storedStep, lastSavedAt: new Date() } }
      );
      if (update.matchedCount === 0) {
        throw new HttpException(409, "SESSION_COMPLETED");
      }

      res.status(200).json({ success: true });
    } catch (error) {
      throw_error(res, error);
    }
  }

  // Public endpoint - record that the participant came back after an interruption.
  async resume(req: Request, res: Response) {
    try {
      const body = isRecord(req.body) ? req.body : {};
      if (!isIndex(body.fromSeq, MAX_STEPS) || !isIndex(body.fromPlanIndex, MAX_STEPS)) {
        throw new HttpException(400, "INVALID_SESSION_DATA");
      }

      const session = await this.findSession(req, { status: 1 });
      if (session.status !== "in_progress") {
        throw new HttpException(409, "SESSION_COMPLETED");
      }

      const browserInfo = normalizeBrowserInfo(body.browser_info ?? body.browserInfo);
      await ResultModel.updateOne(
        { _id: session._id },
        {
          $push: {
            resumes: {
              at: new Date(),
              fromSeq: body.fromSeq,
              fromPlanIndex: body.fromPlanIndex,
              userAgent: browserInfo.userAgent,
              windowWidth: browserInfo.windowWidth,
              windowHeight: browserInfo.windowHeight,
            },
          },
        }
      );

      res.status(200).json({ success: true });
    } catch (error) {
      throw_error(res, error);
    }
  }

  // Public endpoint - finish the session once every step is saved.
  async complete(req: Request, res: Response) {
    try {
      const stepCount = isRecord(req.body) ? req.body.stepCount : undefined;
      if (!isIndex(stepCount, MAX_STEPS + 1)) {
        throw new HttpException(400, "INVALID_SESSION_DATA");
      }

      const session = await this.findSession(req, { status: 1, steps: 1, participantEmail: 1 });
      if (session.status !== "in_progress") {
        res.status(200).json({ success: true });
        return;
      }

      const steps: unknown[] = session.steps ?? [];
      const missing = Array.from({ length: stepCount }, (_, seq) => seq).filter(
        (seq) => !isRecord(steps[seq])
      );
      if (missing.length > 0 || steps.length !== stepCount) {
        res.status(409).json({
          message: missing.length > 0 ? "MISSING_STEPS" : "STEP_COUNT_MISMATCH",
          missing,
          savedStepCount: steps.length,
        });
        return;
      }

      await ResultModel.updateOne(
        { _id: session._id, status: "in_progress" },
        { $set: { status: "completed", completedAt: new Date() } }
      );
      await markParticipantCompleted(req.params.id, session.participantEmail ?? undefined);

      res.status(200).json({ success: true });
    } catch (error) {
      throw_error(res, error);
    }
  }
}

export default new ResultSessionRepository();