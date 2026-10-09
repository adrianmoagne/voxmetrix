import { Schema, model, InferSchemaType, Types } from "mongoose";
import { Collections } from "src/@types";

/**
 * Gaze samples and capture metadata of one result step. Kept out of the Result
 * document so results stay small and listing them never loads gaze data.
 */
const GazeCaptureSchema = new Schema(
	{
		result: { type: Types.ObjectId, ref: Collections.Result, required: true },
		experiment: { type: Types.ObjectId, ref: Collections.Experiment, required: true },
		/** Index of the step in `Result.steps`. */
		stepIndex: { type: Number, required: true },
		screenUid: { type: String },
		rowUid: { type: String },
		/** `extras.gazeData` of the step, in columnar form (see `gaze-columns`). */
		samples: { type: Schema.Types.Mixed },
		/** `extras.gazeCapture` of the step; its per-frame arrays are columnar too. */
		capture: { type: Schema.Types.Mixed },
	},
	{ timestamps: true, collection: Collections.GazeCapture, minimize: false }
);

GazeCaptureSchema.index({ result: 1, stepIndex: 1 }, { unique: true });
GazeCaptureSchema.index({ experiment: 1 });

export type TGazeCapture = InferSchemaType<typeof GazeCaptureSchema>;
export const GazeCaptureModel = model<TGazeCapture>("GazeCapture", GazeCaptureSchema);