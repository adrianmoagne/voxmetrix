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
    completedAt: { type: Date, default: Date.now },
    browserInfo: {
      userAgent: { type: String },
      windowWidth: { type: Number },
      windowHeight: { type: Number },
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

export type TResult = InferSchemaType<typeof ResultSchema>;
export const ResultModel = model<TResult>("Result", ResultSchema);
