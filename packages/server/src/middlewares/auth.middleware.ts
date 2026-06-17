import { AUTH_COOKIE_NAME, JWT_SECRET } from "@types";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

declare global {
	namespace Express {
		interface Request {
			user?: { id: string; iat: number; exp: number };
		}
	}
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
	const authToken = req.signedCookies?.[AUTH_COOKIE_NAME];
	if (!authToken) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	jwt.verify(authToken, JWT_SECRET, { algorithms: ["HS256"] }, (err: any, user: any) => {
		if (err) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}
		req.user = user;
		next();
	});
}

export default authenticateToken;
