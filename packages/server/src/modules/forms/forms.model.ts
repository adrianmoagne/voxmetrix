import {
	Schema,
	model,
	InferSchemaType,
	Model,
	Types,
	Collection,
} from "mongoose";
import { Collections } from "src/@types";

const FormsInputSchema = new Schema(
	{
		type: {
			type: String,
			enum: ["checkbox", "text", "textarea", "radio_group", "select"],
			required: true,
		},
		label: { type: String, required: true },
		placeholder: { type: String },
		key: { type: String, required: true },
		required: { type: Boolean, default: false },
		options: [
			{
				label: String,
				value: String,
			},
		],
	},
	{ _id: false }
);

const FormsSchema = new Schema(
	{
		_id: {
			type: Schema.ObjectId,
			auto: true,
			required: true,
		},
		alias: { type: String, required: true },
		status: {
			type: String,
			enum: ["enabled", "disabled"],
			default: "disabled",
		},
		actions: {
			type: [String],
			enum: ["clear", "back", "continue"],
			default: ["back", "continue"],
		},
		inputs: { type: [FormsInputSchema], default: [] },
	},
	{
		timestamps: true,
		collection: Collections.Forms,
		versionKey: false,
	}
);

export type TForms = InferSchemaType<typeof FormsSchema>;
export const FormsModel: Model<TForms> = model<TForms>(
	Collections.Forms,
	FormsSchema
);
