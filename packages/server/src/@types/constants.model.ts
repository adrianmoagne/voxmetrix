if (!process.env.JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required");
}
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
export const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24;
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";
