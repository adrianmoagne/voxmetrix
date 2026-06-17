import mongoose from "mongoose";
import { Endpoints } from "../../@types";
import { server } from "../../app";
import { TScreen } from "./screen.model";
import {
	mockBasicScreen,
	mockComplexScreen,
	mockMediaScreen,
	mockTemplateScreen,
} from "../../mocks/screen.mocks";
import { mockPictureMedia, mockAudioMedia } from "../../mocks/media.mocks";
import st from "supertest";

interface ApiResponse {
	content: any;
}

describe("Screen Test", () => {
	let mong: typeof mongoose;
	let createdScreen: any; // Using any for test purposes

	beforeEach(async () => {
		mong = await mongoose.connect(process.env.DB_URL || "");
	});

	afterAll(async () => {
		await mong.connection.close();
	});

	// describe(`POST ${Endpoints.ScreenCreate}`, () => {
	// 	it("should create a basic screen", async () => {
	// 		const res = await st(server.app)
	// 			.post(`/api${Endpoints.ScreenCreate}`)
	// 			.send(mockBasicScreen);

	// 		expect(res.statusCode).toBe(201);
	// 		const response = res.body as ApiResponse;
	// 		createdScreen = response.content;
	// 		expect(createdScreen).toBeTruthy();
	// 		expect(createdScreen.grid.type).toBe("1x1");
	// 		expect(createdScreen.items.length).toBe(1);
	// 		expect(createdScreen.items[0].type).toBe("text");
	// 	});

	// 	it("should create a complex screen with media and form", async () => {
	// 		const res = await st(server.app)
	// 			.post(`/api${Endpoints.ScreenCreate}`)
	// 			.send(mockComplexScreen);

	// 		expect(res.statusCode).toBe(201);
	// 		const screen = res.body.content;
	// 		expect(screen).toBeTruthy();
	// 		expect(screen.grid.type).toBe("2x2");
	// 		expect(screen.items).toHaveLength(3);
	// 		expect(screen.items.map((item: any) => item.type)).toContain("media");
	// 		expect(screen.items.map((item: any) => item.type)).toContain("form");
	// 	});

	// 	it("should create a media screen with 3x3 grid", async () => {
	// 		const res = await st(server.app)
	// 			.post(`/api${Endpoints.ScreenCreate}`)
	// 			.send(mockMediaScreen);

	// 		expect(res.statusCode).toBe(201);
	// 		const screen = res.body.content;
	// 		expect(screen).toBeTruthy();
	// 		expect(screen.grid.type).toBe("3x3");
	// 		expect(screen.items).toHaveLength(3);
	// 		expect(screen.items.every((item: any) => item.type === "media")).toBe(
	// 			true
	// 		);
	// 	});
	// });

	// describe(`GET ${Endpoints.ScreenList}`, () => {
	// 	it("should list all screens", async () => {
	// 		const res = await st(server.app).get(`/api${Endpoints.ScreenList}`);

	// 		expect(res.statusCode).toBe(200);
	// 		expect(Array.isArray(res.body)).toBe(true);
	// 		expect(res.body.length).toBeGreaterThanOrEqual(3);
	// 	});
	// });

	// describe(`GET ${Endpoints.ScreenListById}`, () => {
	// 	it("should get a screen by ID", async () => {
	// 		const res = await st(server.app).get(
	// 			`/api${Endpoints.ScreenListById.replace(
	// 				":id",
	// 				createdScreen._id.toString()
	// 			)}`
	// 		);

	// 		expect(res.statusCode).toBe(200);
	// 		expect(res.body._id).toBe(createdScreen._id.toString());
	// 		expect(res.body.alias).toBe(createdScreen.alias);
	// 	});

	// 	it("should return 404 for non-existent screen ID", async () => {
	// 		const nonExistentId = new mongoose.Types.ObjectId();
	// 		const res = await st(server.app).get(
	// 			`/api${Endpoints.ScreenListById.replace(
	// 				":id",
	// 				nonExistentId.toString()
	// 			)}`
	// 		);

	// 		expect(res.statusCode).toBe(404);
	// 	});
	// });

	// describe(`DELETE ${Endpoints.ScreenDelete}`, () => {
	// 	it("should delete a screen", async () => {
	// 		const res = await st(server.app).delete(
	// 			`/api${Endpoints.ScreenDelete.replace(
	// 				":id",
	// 				createdScreen._id.toString()
	// 			)}`
	// 		);

	// 		expect(res.statusCode).toBe(204);

	// 		// Verify the screen was deleted
	// 		const getRes = await st(server.app).get(
	// 			`/api${Endpoints.ScreenListById.replace(
	// 				":id",
	// 				createdScreen._id.toString()
	// 			)}`
	// 		);

	// 		expect(getRes.statusCode).toBe(404);
	// 	});

	// 	it("should return 404 when deleting non-existent screen", async () => {
	// 		const nonExistentId = new mongoose.Types.ObjectId();
	// 		const res = await st(server.app).delete(
	// 			`/api${Endpoints.ScreenDelete.replace(":id", nonExistentId.toString())}`
	// 		);

	// 		expect(res.statusCode).toBe(404);
	// 	});
	// });

	describe(`POST ${Endpoints.ScreenFromTemplate}`, () => {
		it("should create screens from a template with column-based structure", async () => {
			const res = await st(server.app)
				.post(`/api${Endpoints.ScreenFromTemplate}`)
				.send({
					template_id: "68e3dd97098d8fda517e713f",
					screens: [
						{
							image_1: "68c487085d08e5be9be9e9b3",
							image_2: "68d5910c2deccb16a75f8453",
							audio_1: "68c85dde86693884585655a9",
						},
						{
							image_1: "68c487085d08e5be9be9e9b4",
							image_2: "68d5910c2deccb16a75f8454",
							audio_1: "68c85dde86693884585655aa",
						},
					],
				});

			expect(res.statusCode).toBe(201);
			const screens = res.body.content;
			expect(Array.isArray(screens)).toBe(true);
			expect(screens).toHaveLength(2); // Two screens created
			expect(screens[0].grid.type).toBe("3x3");
			expect(screens[0].items).toHaveLength(3);
			expect(screens[1].grid.type).toBe("3x3");
			expect(screens[1].items).toHaveLength(3);
		});

		it("should fail when a screen is missing required keys", async () => {
			const res = await st(server.app)
				.post(`/api${Endpoints.ScreenFromTemplate}`)
				.send({
					template_id: "68e3dd97098d8fda517e713f",
					screens: [
						{
							image_1: "68c487085d08e5be9be9e9b3",
							// Missing image_2 and audio_1
						},
					],
				});

			expect(res.statusCode).toBe(400);
			expect(res.body.message).toBeTruthy();
		});

		it("should create single screen", async () => {
			const res = await st(server.app)
				.post(`/api${Endpoints.ScreenFromTemplate}`)
				.send({
					template_id: "68e3dd97098d8fda517e713f",
					screens: [
						{
							image_1: "68c487085d08e5be9be9e9b3",
							image_2: "68d5910c2deccb16a75f8453",
							audio_1: "68c85dde86693884585655a9",
						},
					],
				});

			expect(res.statusCode).toBe(201);
			const screens = res.body.content;
			expect(Array.isArray(screens)).toBe(true);
			expect(screens).toHaveLength(1); // One screen created
		});
	});
});
