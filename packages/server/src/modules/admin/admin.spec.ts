import mongoose from "mongoose";
import { Endpoints } from "../../@types";
import { server } from "../../app";
import { AdminModel } from "./admin.model";
import { buildAuthCookie } from "../../test-utils/auth";
import st from "supertest";

describe("Auth & Admin routes", () => {
	const password = "securepassword123";
	let adminId: string;

	beforeAll(async () => {
		await mongoose.connect(process.env.DB_URL || "");
		await AdminModel.deleteMany({});
		const admin = await AdminModel.create({
			username: "admin_user",
			password,
			name: "Admin",
			mail: "admin_user@example.com",
		});
		adminId = admin._id.toString();
	});

	afterAll(async () => {
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
	});

	describe(`POST ${Endpoints.Register}`, () => {
		it("registers a new admin", async () => {
			const res = await st(server.app).post(`/api${Endpoints.Register}`).send({
				username: "new_user",
				password: "anotherpassword",
				name: "New User",
				mail: "new_user@example.com",
			});

			expect(res.statusCode).toBe(201);
		});

		it("rejects a duplicate email", async () => {
			const res = await st(server.app).post(`/api${Endpoints.Register}`).send({
				username: "dup_user",
				password: "anotherpassword",
				name: "Dup",
				mail: "admin_user@example.com",
			});

			expect(res.statusCode).toBe(409);
		});
	});

	describe(`POST ${Endpoints.Login}`, () => {
		it("logs in with valid credentials and sets a cookie", async () => {
			const res = await st(server.app).post(`/api${Endpoints.Login}`).send({
				email: "admin_user@example.com",
				password,
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers["set-cookie"]).toBeDefined();
		});

		it("rejects an invalid password", async () => {
			const res = await st(server.app).post(`/api${Endpoints.Login}`).send({
				email: "admin_user@example.com",
				password: "wrong-password",
			});

			expect(res.statusCode).toBe(400);
		});

		it("returns 404 for an unknown user", async () => {
			const res = await st(server.app).post(`/api${Endpoints.Login}`).send({
				email: "nobody@example.com",
				password,
			});

			expect(res.statusCode).toBe(404);
		});
	});

	describe(`GET ${Endpoints.Me}`, () => {
		it("requires authentication", async () => {
			const res = await st(server.app).get(`/api${Endpoints.Me}`);
			expect(res.statusCode).toBe(401);
		});

		it("succeeds with a valid auth cookie", async () => {
			const res = await st(server.app)
				.get(`/api${Endpoints.Me}`)
				.set("Cookie", buildAuthCookie(adminId));

			expect(res.statusCode).toBe(200);
		});
	});

	describe(`GET ${Endpoints.AdminbyId}`, () => {
		it("requires authentication", async () => {
			const res = await st(server.app).get(`/api${Endpoints.AdminbyId}`);
			expect(res.statusCode).toBe(401);
		});

		it("returns the authenticated admin's profile", async () => {
			const res = await st(server.app)
				.get(`/api${Endpoints.AdminbyId}`)
				.set("Cookie", buildAuthCookie(adminId));

			expect(res.statusCode).toBe(200);
			expect(res.body.username).toBe("admin_user");
			expect(res.body.email).toBe("admin_user@example.com");
		});
	});
});
