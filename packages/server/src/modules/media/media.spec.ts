import mongoose from "mongoose";
import { Endpoints } from "../../@types";
import { server } from "../../app";
import { TMedia } from "./media.model";
import { mockAudioMedia, mockPictureMedia } from "../../mocks/media.mocks";
import st from "supertest";

interface ApiResponse {
	content: any;
}

describe("Media Test", () => {
	let mong: typeof mongoose;
	let createdMedia: any; // Using any for test purposes

	beforeEach(async () => {
		mong = await mongoose.connect(process.env.DB_URL || "");
	});

	afterAll(async () => {
		await mong.connection.close();
	});

	describe(`POST ${Endpoints.MediaCreate}`, () => {
		it("should create an audio media", async () => {
			const res = await st(server.app)
				.post(`/api${Endpoints.MediaCreate}`)
				.send(mockAudioMedia);

			expect(res.statusCode).toBe(201);
			const response = res.body as ApiResponse;
			createdMedia = response.content;
			expect(createdMedia).toBeTruthy();
			expect(createdMedia.type).toBe("audio");
			expect(createdMedia.filename).toBe("test-audio.mp3");
			expect(createdMedia.extension).toBe("mp3");
			expect(createdMedia.alias).toBe("test-audio");
		});

		it("should create a picture media", async () => {
			const res = await st(server.app)
				.post(`/api${Endpoints.MediaCreate}`)
				.send(mockPictureMedia);

			expect(res.statusCode).toBe(201);
			const media = res.body.content;
			expect(media).toBeTruthy();
			expect(media.type).toBe("picture");
			expect(media.filename).toBe("test-picture.jpg");
			expect(media.extension).toBe("jpg");
			expect(media.alias).toBe("test-picture");
		});

		it("should validate required fields", async () => {
			const invalidMedia = {
				// Missing required fields like alias, type, src, filename
				extension: "mp3",
				size: 1024,
			};

			const res = await st(server.app)
				.post(`/api${Endpoints.MediaCreate}`)
				.send(invalidMedia);

			expect(res.statusCode).toBe(400);
		});

		it("should validate media type enum", async () => {
			const invalidTypeMedia = {
				...mockAudioMedia,
				type: "video", // Invalid type
			};

			const res = await st(server.app)
				.post(`/api${Endpoints.MediaCreate}`)
				.send(invalidTypeMedia);

			expect(res.statusCode).toBe(400);
		});
	});

	describe(`GET ${Endpoints.MediaList}`, () => {
		it("should list all media", async () => {
			const res = await st(server.app).get(`/api${Endpoints.MediaList}`);

			expect(res.statusCode).toBe(200);
			expect(Array.isArray(res.body)).toBe(true);
			expect(res.body.length).toBeGreaterThanOrEqual(2);

			// Check if we have both audio and picture types
			const types = res.body.map((media: any) => media.type);
			expect(types).toContain("audio");
			expect(types).toContain("picture");
		});
	});

	describe(`GET ${Endpoints.MediaListById}`, () => {
		it("should get a media by ID", async () => {
			const res = await st(server.app).get(
				`/api${Endpoints.MediaListById.replace(
					":id",
					createdMedia._id.toString()
				)}`
			);

			expect(res.statusCode).toBe(200);
			expect(res.body._id).toBe(createdMedia._id.toString());
			expect(res.body.alias).toBe(createdMedia.alias);
			expect(res.body.type).toBe(createdMedia.type);
		});

		it("should return 404 for non-existent media ID", async () => {
			const nonExistentId = new mongoose.Types.ObjectId();
			const res = await st(server.app).get(
				`/api${Endpoints.MediaListById.replace(
					":id",
					nonExistentId.toString()
				)}`
			);

			expect(res.statusCode).toBe(404);
		});

		it("should return 400 for invalid media ID format", async () => {
			const invalidId = "invalid-id-format";
			const res = await st(server.app).get(
				`/api${Endpoints.MediaListById.replace(":id", invalidId)}`
			);

			expect(res.statusCode).toBe(400); // Mongoose validation error for invalid ObjectId
		});
	});

	describe(`DELETE ${Endpoints.MediaDelete}`, () => {
		it("should delete a media", async () => {
			const res = await st(server.app).delete(
				`/api${Endpoints.MediaDelete.replace(
					":id",
					createdMedia._id.toString()
				)}`
			);

			expect(res.statusCode).toBe(204);

			// Verify the media was deleted
			const getRes = await st(server.app).get(
				`/api${Endpoints.MediaListById.replace(
					":id",
					createdMedia._id.toString()
				)}`
			);

			expect(getRes.statusCode).toBe(404);
		});

		it("should return 404 when deleting non-existent media", async () => {
			const nonExistentId = new mongoose.Types.ObjectId();
			const res = await st(server.app).delete(
				`/api${Endpoints.MediaDelete.replace(":id", nonExistentId.toString())}`
			);

			expect(res.statusCode).toBe(404);
		});

		it("should return 400 for invalid media ID format when deleting", async () => {
			const invalidId = "invalid-id-format";
			const res = await st(server.app).delete(
				`/api${Endpoints.MediaDelete.replace(":id", invalidId)}`
			);

			expect(res.statusCode).toBe(400); // Mongoose validation error for invalid ObjectId
		});
	});

	describe("Media Model Validation", () => {
		it("should have proper timestamps", async () => {
			const res = await st(server.app)
				.post(`/api${Endpoints.MediaCreate}`)
				.send({
					...mockAudioMedia,
					alias: "timestamp-test-media",
				});

			expect(res.statusCode).toBe(201);
			const media = res.body.content;
			expect(media.createdAt).toBeDefined();
			expect(media.updatedAt).toBeDefined();
			expect(new Date(media.createdAt)).toBeInstanceOf(Date);
			expect(new Date(media.updatedAt)).toBeInstanceOf(Date);
		});

		it("should handle optional fields correctly", async () => {
			const mediaWithoutOptionalFields = {
				alias: "minimal-media",
				type: "audio",
				src: "https://example.com/minimal.mp3",
				filename: "minimal.mp3",
				// original_name, extension, size are optional
			};

			const res = await st(server.app)
				.post(`/api${Endpoints.MediaCreate}`)
				.send(mediaWithoutOptionalFields);

			expect(res.statusCode).toBe(201);
			const media = res.body.content;
			expect(media.original_name).toBeUndefined();
			expect(media.extension).toBeUndefined();
			expect(media.size).toBeUndefined();
		});
	});
});
