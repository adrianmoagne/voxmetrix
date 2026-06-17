import { Schema, model, InferSchemaType, Types } from "mongoose";
import { Collections } from "src/@types";
import type { ExperimentDefinition } from "./experiment-definition.types";

const ParticipantSchema = new Schema(
	{
		email: { type: String, required: true },
		status: {
			type: String,
			enum: ["invited", "started", "completed"],
			default: "invited",
		},
		invitedAt: { type: Date, default: Date.now },
		startedAt: { type: Date },
		completedAt: { type: Date },
		assignedCondition: { type: String },
		assignedAt: { type: Date },
	},
	{ _id: false },
);

const ExperimentSchema = new Schema(
	{
		_id: {
			type: Schema.ObjectId,
			auto: true,
			required: true,
		},
		alias: { type: String, required: true },
		description: { type: String },
		status: {
			type: String,
			enum: ["draft", "active", "completed", "archived"],
			default: "draft",
		},
		enabled: { type: Boolean, default: true },
		owner: { type: Types.ObjectId, ref: Collections.Admin, required: true },
		results: [{ type: Types.ObjectId, ref: Collections.Result }],
		schemaVersion: { type: Number, enum: [2], default: 2 },
		definition: { type: Schema.Types.Mixed, required: true },

		participants: [ParticipantSchema],
	},
	{ timestamps: true, collection: Collections.Experiment, minimize: false },
);

export type TExperiment = Omit<
	InferSchemaType<typeof ExperimentSchema>,
	"definition"
> & {
	definition: ExperimentDefinition;
};

export const ExperimentModel = model<TExperiment>(
	"Experiment",
	ExperimentSchema,
);
