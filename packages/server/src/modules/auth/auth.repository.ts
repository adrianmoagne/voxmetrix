import { HttpException } from "@core/server";
import { NextFunction, Request, Response } from "express";
import { throw_error } from "@utils/throw_error";
import { AdminModel } from "@modules/admin";
import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { COOKIE_MAX_AGE, JWT_EXPIRES_IN, JWT_SECRET } from "@types";
import authenticateToken from "@middlewares/auth.middleware";
import { AUTH_COOKIE_NAME } from "@types";
const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
	httpOnly: true,
	maxAge: COOKIE_MAX_AGE,
	sameSite: isProduction ? "none" as const : "lax" as const,
	secure: isProduction,
	signed: true,
};

const clearAuthCookieOptions = {
	httpOnly: true,
	sameSite: isProduction ? "none" as const : "lax" as const,
	secure: isProduction,
	signed: true,
};

class AuthRepository {
	async login(req: Request, res: Response) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				throw new HttpException(400, "USER_NOT_FOUND");
			}
			const admin = await AdminModel.findOne({
				mail: email,
			});
			if (!admin) {
				throw new HttpException(404, "USER_NOT_FOUND");
			}

			const isValidPassword = await compare(password, admin.password);
			if (!isValidPassword) {
				throw new HttpException(400, "INVALID_PASSWORD");
			}

			const accessToken = jwt.sign({ id: admin._id }, JWT_SECRET, {
				expiresIn: "1d",
			});

			res
				.status(200)
				.cookie(AUTH_COOKIE_NAME, accessToken, {
					httpOnly: true,
					maxAge: COOKIE_MAX_AGE,
					sameSite: "none",
					secure: true,
					signed: true,
				})
				.send();
			// return;
		} catch (error) {
			throw_error(res, error);
			return;
		}
	}

	async Register(req: Request, res: Response) {
		try {
			const {
				mail,
				password,
				username,
				name,
				alias,
				institution,
				phone,
				description,
			} = req.body;

			const existingUser = await AdminModel.findOne({ mail });
			if (existingUser) {
				throw new HttpException(409, "EMAIL_ALREADY_EXISTS");
			}

			const existingUsername = await AdminModel.findOne({ username });
			if (existingUsername) {
				throw new HttpException(409, "USERNAME_ALREADY_EXISTS");
			}

			const admin = await AdminModel.create({
				mail: mail,
				password,
				username,
				name,
				alias: alias || "",
				institution: institution || "",
				phone: phone || "",
				description: description || "",
			});
			res.status(201).send();
		} catch (error) {
			throw_error(res, error);
			return;
		}
	}

	async me(req: Request, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				throw new HttpException(401, "UNAUTHORIZED");
			}

			const admin = await AdminModel.findById(userId);
			if (!admin) {
				throw new HttpException(404, "USER_NOT_FOUND");
			}

			res.status(200).send();
		} catch (error) {
			throw_error(res, error);
		}
	}

	async logout(req: Request, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				throw new HttpException(401, "UNAUTHORIZED");
			}
			res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions).status(200).send();
		} catch (error) {
			throw_error(res, error);
		}
	}
}

export default new AuthRepository();
