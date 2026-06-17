import {
	Schema,
	model,
	InferSchemaType,
	Model,
	Types,
	Collection,
} from "mongoose";
import { Collections } from "src/@types";

const ProjectSchema = new Schema(
	{
		_id: {
			type: Schema.ObjectId,
			auto: true,
			required: true,
		},
		alias: { type: String, required: true },
		// participants: [{ type: Types.ObjectId, refPath: "participantModel" }],
		description: { type: String, default: "" },
		participants_count: { type: Number, default: 0 },
		owner: { type: Types.ObjectId, ref: Collections.Admin, required: true },
		experiments: [{ type: Types.ObjectId, ref: Collections.Experiment }],
	},
	{ timestamps: true, collection: Collections.Project, versionKey: false }
);

export type TProject = InferSchemaType<typeof ProjectSchema>;
export const ProjectModel = model<TProject>("Project", ProjectSchema);
