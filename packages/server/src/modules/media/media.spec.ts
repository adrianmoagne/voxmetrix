import mongoose, { Types } from "mongoose";
import { Endpoints } from "../../@types";
import { server } from "../../app";
import { MediaModel } from "./media.model";
import { buildAuthCookie } from "../../test-utils/auth";
import st from "supertest";

describe("Media routes", () => {
	const userId = new Types.ObjectId().toString();
	const cookie = buildAuthCookie(userId);

	const seedMedia = (overrides: Record<string, unknown> = {}) => ({
		alias: "test-audio",
		type: "audio" as const,
		src: "https://example.com/audio/test.mp3",
		filename: "test-audio.mp3",
		owner: userId,
		...overrides,
	});

	beforeAll(async () => {
		await mongoose.connect(process.env.DB_URL || "");
	});

	afterAll(async () => {
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
	});

	beforeEach(async () => {
		await MediaModel.deleteMany({});
	});

	describe(`GET ${Endpoints.MediaList}`, () => {
		it("requires authentication", async () => {
			const res = await st(server.app).get(`/api${Endpoints.MediaList}`);
			expect(res.statusCode).toBe(401);
		});

		it("returns only the authenticated user's media", async () => {
			await MediaModel.create([
				seedMedia({ alias: "mine-audio", type: "audio", filename: "a.mp3" }),
				seedMedia({ alias: "mine-picture", type: "picture", filename: "p.jpg" }),
				seedMedia({
					alias: "someone-else",
					type: "audio",
					filename: "x.mp3",
					owner: new Types.ObjectId().toString(),
				}),
			]);

			const res = await st(server.app)
				.get(`/api${Endpoints.MediaList}`)
				.set("Cookie", cookie);

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.count).toBe(2);
			expect(res.body.data).toHaveLength(2);

			const types = res.body.data.map((m: { type: string }) => m.type);
			expect(types).toContain("audio");
			expect(types).toContain("picture");
		});
	});

	describe(`GET ${Endpoints.MediaListById}`, () => {
		it("requires authentication", async () => {
			const media = await MediaModel.create(seedMedia());
			const res = await st(server.app).get(
				`/api${Endpoints.MediaListById.replace(":id", String(media._id))}`
			);
			expect(res.statusCode).toBe(401);
		});

		it("returns a media by id", async () => {
			const media = await MediaModel.create(seedMedia());
			const res = await st(server.app)
				.get(`/api${Endpoints.MediaListById.replace(":id", String(media._id))}`)
				.set("Cookie", cookie);

			expect(res.statusCode).toBe(200);
			expect(res.body._id).toBe(String(media._id));
			expect(res.body.type).toBe("audio");
			expect(res.body.alias).toBe("test-audio");
		});

		it("returns 404 for a non-existent media id", async () => {
			const nonExistentId = new Types.ObjectId().toString();
			const res = await st(server.app)
				.get(`/api${Endpoints.MediaListById.replace(":id", nonExistentId)}`)
				.set("Cookie", cookie);

			expect(res.statusCode).toBe(404);
		});
	});

	describe("Media model", () => {
		it("stores timestamps", async () => {
			const media = await MediaModel.create(seedMedia());
			expect(media.createdAt).toBeInstanceOf(Date);
			expect(media.updatedAt).toBeInstanceOf(Date);
		});

		it("requires the mandatory fields", async () => {
			await expect(
				MediaModel.create({ alias: "missing-required-fields" })
			).rejects.toThrow();
		});
	});
});
