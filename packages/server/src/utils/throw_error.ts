import { HttpException } from "@core/server";
import { Response } from "express";

export function throw_error(res: Response, error: unknown): Response {
	if (error instanceof HttpException) {
		console.log(`**ERROR**: [${error.status}] : ${error.message}`);
		return res.status(error.status).json({ message: error.message });
	}

	const message = error instanceof Error ? error.message : String(error);
	console.log(`**ERROR**: ${message}`);

	return res.status(500).json({ message: "Internal server error" });
}
