import express, { Application } from "express";
import {
	AuthController,
	AdminController,
	MediaController,
	FormsController,
	ScreenController,
	ProjectController,
	ExperimentController,
	ResultController,
} from "src/modules";
import { json } from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { JWT_SECRET } from "@types";
import { ensureUploadDir, uploadDir } from "@config/storage.config";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class Server {
	app!: Application;
	port!: number | string;
	api_prefix = process.env.API_PREFIX || "/api";

	constructor(port: number | string) {
		this.app = express();
		this.port = port;

		this.set_middlewares();
		this.init_routes();

		this.connect_mongo_db();
	}

	start(): void {
		this.app.listen(this.port, () => {
			console.log(`Server started at port ${this.port}`);
		});
	}

	private init_routes(): void {
		const auth_controller = new AuthController();
		console.log(`Auth controller: ${auth_controller.router}`);
		const admin_controller = new AdminController();
		const media_controller = new MediaController();
		const forms_controller = new FormsController();
		const screen_controller = new ScreenController();
		const project_controller = new ProjectController();
		const experiment_controller = new ExperimentController();
		const result_controller = new ResultController();

		this.app.use(this.api_prefix, auth_controller.router);
		this.app.use(this.api_prefix, admin_controller.router);
		this.app.use(this.api_prefix, media_controller.router);
		this.app.use(this.api_prefix, forms_controller.router);
		this.app.use(this.api_prefix, screen_controller.router);
		this.app.use(this.api_prefix, project_controller.router);
		this.app.use(this.api_prefix, experiment_controller.router);
		this.app.use(this.api_prefix, result_controller.router);
	}

	private set_middlewares(): void {
		const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3001")
			.split(",")
			.map((origin) => origin.trim());
		this.app.use(
			cors({
				origin: (origin, callback) => {
					if (!origin) return callback(null, true);
					if (allowedOrigins.includes(origin)) {
						return callback(null, true);
					}
					return callback(new Error("Not allowed by CORS"));
				},
				credentials: true,
			})
		);
		this.app.use((req, _res, next) => {
			console.log(req.method, req.originalUrl);
			next();
		});
		this.app.use(json({ limit: "50mb" }));
		ensureUploadDir();
		this.app.use(`${this.api_prefix}/media/files`, express.static(uploadDir));

		this.app.use(cookieParser(JWT_SECRET));
	}

	private async connect_mongo_db(): Promise<void> {
		const maxAttempts = Number(process.env.MONGO_CONNECT_ATTEMPTS || 10);
		const retryDelayMs = Number(process.env.MONGO_CONNECT_RETRY_MS || 3000);
		const dbUrl = process.env.DB_URL || "";

		for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
			try {
				await mongoose.connect(dbUrl);
				console.log("Connected to database");
				return;
			} catch (error) {
				console.error(`Error connecting to database, attempt ${attempt}/${maxAttempts}:`, error);
				if (attempt < maxAttempts) {
					await sleep(retryDelayMs);
				}
			}
		}
	}
}
