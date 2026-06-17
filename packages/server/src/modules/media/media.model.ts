import {
	Schema,
	model,
	InferSchemaType,
	Model,
	Types,
	Collection,
} from "mongoose";
import { Collections } from "src/@types";

const MediaSchema = new Schema(
	{
		_id: {
			type: Schema.ObjectId,
			auto: true,
			required: true,
		},
		alias: { type: String, required: true },
		type: { type: String, enum: ["audio", "picture"], required: true },
		owner: { type: Types.ObjectId, ref: Collections.Admin, required: true },
		used_by: [{ type: Types.ObjectId, ref: Collections.Screen }],
		src: { type: String, required: true },
		filename: { type: String, required: true },
		original_name: { type: String },
		extension: { type: String },
		size: { type: Number },
	},
	{
		timestamps: true,
		collection: Collections.Media,
	}
);

export type TMedia = InferSchemaType<typeof MediaSchema>;
export const MediaModel: Model<TMedia> = model<TMedia>(
	Collections.Media,
	MediaSchema
);
