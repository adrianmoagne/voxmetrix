import { ExperimentModel } from "../experiment/experiment.model";

type JsonRecord = Record<string, unknown>;

export interface BrowserInfo {
  userAgent?: string;
  windowWidth?: number;
  windowHeight?: number;
  timeOrigin?: number;
}

export const isRecord = (value: unknown): value is JsonRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const normalizeString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const positiveNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
};

/** Accepts both camelCase and snake_case keys, as sent by older clients. */
export const normalizeBrowserInfo = (input: unknown): BrowserInfo => {
  const info = isRecord(input) ? input : {};
  const width = positiveNumber(info.windowWidth ?? info.window_width);
  const height = positiveNumber(info.windowHeight ?? info.window_height);
  const hasViewport = width !== undefined && height !== undefined;

  return {
    userAgent: normalizeString(info.userAgent),
    windowWidth: hasViewport ? width : undefined,
    windowHeight: hasViewport ? height : undefined,
    timeOrigin: positiveNumber(info.timeOrigin ?? info.time_origin),
  };
};

export interface ParticipantInput {
  email?: string;
  name?: string;
  condition?: string;
}

export const normalizeParticipant = (body: JsonRecord): ParticipantInput => {
  const participant = isRecord(body.participant) ? body.participant : {};
  return {
    email: normalizeString(participant.email)?.toLowerCase(),
    name: normalizeString(participant.name),
    condition: normalizeString(body.participantCondition ?? body.participant_condition),
  };
};

/**
 * Marks an invited participant as completed with a single atomic update, so it
 * cannot fail on a concurrent change to the experiment document.
 */
export const markParticipantCompleted = async (
  experimentId: unknown,
  email: string | undefined
): Promise<void> => {
  if (!email) return;
  await ExperimentModel.updateOne(
    { _id: experimentId, "participants.email": email },
    {
      $set: {
        "participants.$.status": "completed",
        "participants.$.completedAt": new Date(),
      },
    }
  );
};