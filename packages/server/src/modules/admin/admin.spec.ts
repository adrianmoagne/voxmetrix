import mongoose from "mongoose";
import { Endpoints } from "../../@types";
import { server } from "../../app";
import { TAdmin } from "./admin.model";
import { mockAdmin } from "../../mocks/admin.mocks";
import st from "supertest";

describe("Admin Test", () => {
	let mong: typeof mongoose;
	let createdAdmin: TAdmin;

	beforeEach(async () => {
		mong = await mongoose.connect(process.env.DB_URL || "");
	});

	afterAll(async () => {
		await mong.connection.close();
	});

	describe(`POST ${Endpoints.AdminCreate}`, () => {
		it("should create an admin", async () => {
			const res = await st(server.app)
				.post(`/api${Endpoints.AdminCreate}`)
				.send(mockAdmin);

			expect(res.statusCode).toBe(201);

			createdAdmin = res.body.content;

			expect(createdAdmin).toBeTruthy();
		});
	});

	describe(`GET ${Endpoints.AdminList}`, () => {
		it("should list all admins", async () => {
			const res = await st(server.app).get(`/api${Endpoints.AdminList}`);

			expect(res.statusCode).toBe(200);
			expect(res.body).toBeInstanceOf(Array);
			expect(res.body.length).toBeGreaterThan(0);
		});
	});

	describe(`GET ${Endpoints.AdminListById}`, () => {
		it("should get an admin by ID", async () => {
			const res = await st(server.app).get(
				`/api${Endpoints.AdminListById.replace(
					":id",
					createdAdmin._id.toString()
				)}`
			);

			expect(res.statusCode).toBe(200);
			expect(res.body._id).toEqual(createdAdmin._id.toString());
		});
	});

	describe(`DELETE ${Endpoints.AdminListById}`, () => {
		it("should delete an admin by ID", async () => {
			const res = await st(server.app).delete(
				`/api${Endpoints.AdminListById.replace(
					":id",
					createdAdmin._id.toString()
				)}`
			);

			expect(res.statusCode).toBe(204);
		});
	});
});
