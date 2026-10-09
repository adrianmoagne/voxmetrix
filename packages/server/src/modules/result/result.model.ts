import { Schema, model, InferSchemaType, Types } from "mongoose";
import { Collections } from "src/@types";

const ResultSchema = new Schema(
  {
    _id: {
      type: Schema.ObjectId,
      auto: true,
      required: true,
    },
    experiment: {
      type: Types.ObjectId,
      ref: Collections.Experiment,
      required: true,
    },
    participantEmail: { type: String },
    participantName: { type: String },
    participantCondition: { type: String },
    /** Sessions are `in_progress` until every step is saved; results without the field are complete. */
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "completed",
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    lastSavedAt: { type: Date },
    /** SHA-256 of the session token the participant's browser holds; required to write to the session. */
    sessionTokenHash: { type: String, select: false },
    /** Seed of the session's randomization (row order, side swaps, stimulus shuffles). */
    seed: { type: Number },
    /** Planned steps in order, as built from the seed: `{ planIndex, stepUid, rowUid }`. */
    plan: { type: [Schema.Types.Mixed], default: undefined },
    /** Each time the participant came back after an interruption. */
    resumes: {
      type: [
        {
          _id: false,
          at: { type: Date, required: true },
          /** First step index (in `steps`) saved after the resume. */
          fromSeq: { type: Number, required: true },
          /** Plan index the participant resumed at; that trial is presented again. */
          fromPlanIndex: { type: Number, required: true },
          userAgent: { type: String },
          windowWidth: { type: Number },
          windowHeight: { type: Number },
        },
      ],
      default: undefined,
    },
    browserInfo: {
      userAgent: { type: String },
      windowWidth: { type: Number },
      windowHeight: { type: Number },
      /** Epoch ms of `performance.now()` = 0 in the participant's page; step and gaze times count from it. */
      timeOrigin: { type: Number },
    },
    schemaVersion: { type: Number, enum: [2], default: 2 },
    steps: {
      type: [Schema.Types.Mixed],
      required: true,
      default: [],
    },
  },
  { timestamps: true, collection: Collections.Result }
);

ResultSchema.index({ experiment: 1 });
ResultSchema.index({ experiment: 1, participantEmail: 1 });
ResultSchema.index({ experiment: 1, status: 1 });

export type TResult = InferSchemaType<typeof ResultSchema>;
export const ResultModel = model<TResult>("Result", ResultSchema);
