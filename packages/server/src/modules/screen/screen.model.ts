import {
	Schema,
	model,
	InferSchemaType,
	Model,
	Types,
	Collection,
} from "mongoose";
import { Collections } from "src/@types";

const ScreenItemSchema = new Schema(
	{
		media: {
			type: Types.ObjectId,
			ref: Collections.Media,
			required: false,
		},
		form: {
			type: Types.ObjectId,
			ref: Collections.Forms,
			required: false,
		},
		template_type: {
			type: String,
			enum: ["audio", "image"],
			required: false,
		},
		type: {
			type: String,
			enum: ["media", "form", "text", "template"],
			required: true,
		},
		position: {
			type: String,
			enum: ["center", "left", "right"],
			required: true,
		},
		area: {
			type: String,
			enum: ["heading", "content", "footer"],
			required: true,
		},
		v_align: {
			type: String,
			enum: ["top", "center", "bottom"],
			required: true,
		},
		h_align: {
			type: String,
			enum: ["center", "left", "right"],
			required: true,
		},
		text: {
			type: String,
			required: false,
		},
	},
	{ _id: false }
);

const ScreenSchema = new Schema(
	{
		_id: {
			type: Schema.ObjectId,
			auto: true,
			required: true,
		},
		alias: { type: String, required: true },
		used_by: [{ type: Types.ObjectId }],
		grid: {
			type: {
				type: String,
				enum: ["1x1", "2x2", "3x3"],
				required: true,
			},
			subtype: {
				type: String,
				enum: ["equal", "v_centered", "h_centered"],
			},
		},
		actions: {
			default: {
				type: [String],
				enum: ["back", "next", "continue"],
				required: false,
			},
			use_form_actions: {
				type: Types.ObjectId,
				ref: Collections.Forms,
				required: false,
			},
			use_media_actions: {
				type: [String],
				enum: ["next_on_select", "allow_unselect", "link_media_with_form"],
				required: false,
			},
		},
		items: {
			type: [ScreenItemSchema],
			required: true,
			default: [],
		},
		enable_tracking: { type: Boolean, default: false },
		is_calibration: { type: Boolean, default: false },
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
		collection: Collections.Screen,
	}
);

export type TScreen = InferSchemaType<typeof ScreenSchema>;
export const ScreenModel: Model<TScreen> = model<TScreen>(
	"Screen",
	ScreenSchema
);
