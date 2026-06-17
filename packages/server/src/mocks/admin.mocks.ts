import { TAdmin } from "src/modules";
import { Types } from "mongoose";
import crypto from "node:crypto";
export const mockAdminId = new Types.ObjectId();
export const mockAdmin: TAdmin = {
	username: "admin_user",
	password: "securepassword123",
	name: "Admin",
	alias: "TheAdminAlias",
	institution: "Example Institution",
	phone: "+1234567890",
	mail: "admin_user@example.com",
	description: "Administrator account for testing.",
	createdAt: new Date(),
	updatedAt: new Date(),
	_id: mockAdminId,
};
