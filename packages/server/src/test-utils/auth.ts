import crypto from "node:crypto";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME, JWT_SECRET } from "@types";

/**
 * Mirrors `cookie-signature`'s sign(): `value.<base64 HMAC-SHA256>` with
 * trailing "=" padding stripped. cookie-parser uses the same secret (JWT_SECRET)
 * to verify signed cookies, so this lets tests forge an authenticated cookie.
 */
function signValue(value: string, secret: string): string {
	const mac = crypto
		.createHmac("sha256", secret)
		.update(value)
		.digest("base64")
		.replace(/=+$/, "");
	return `${value}.${mac}`;
}

/** Build a signed auth cookie header value for the given (or a random) user id. */
export function buildAuthCookie(
	userId: string = new Types.ObjectId().toString()
): string {
	const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1d" });
	return `${AUTH_COOKIE_NAME}=s:${signValue(token, JWT_SECRET)}`;
}
