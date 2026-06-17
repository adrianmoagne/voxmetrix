import { Schema, model, InferSchemaType, Model } from "mongoose";
import crypto from "node:crypto";
import { Collections } from "src/@types";
import bcrypt from "bcrypt";

const AdminSchema = new Schema(
	{
		_id: {
			type: Schema.ObjectId,
			auto: true,
			required: true,
		},
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		name: { type: String, required: true },
		alias: { type: String },
		institution: { type: String },
		phone: { type: String },
		mail: { type: String , required: true, unique: true },
		description: { type: String },
	},
	{
		timestamps: true,
		collection: Collections.Admin,
	}
);

// Hash password before saving
AdminSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (err) {
		next(err as Error);
	}
});

export type TAdmin = InferSchemaType<typeof AdminSchema>;
export const AdminModel: Model<TAdmin> = model<TAdmin>("Admin", AdminSchema);
