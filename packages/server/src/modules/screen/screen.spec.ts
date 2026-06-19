import mongoose, { Types } from "mongoose";
import { Endpoints } from "../../@types";
import { server } from "../../app";
import { ScreenModel } from "./screen.model";
import { buildAuthCookie } from "../../test-utils/auth";
import st from "supertest";

describe("Screen routes", () => {
	const cookie = buildAuthCookie();

	const templateItem = (
		template_type: "image" | "audio",
		position: "left" | "center" | "right"
	) => ({
		type: "template" as const,
		template_type,
		position,
		area: "content" as const,
		v_align: "center" as const,
		h_align: "center" as const,
	});

	const seedTemplate = () =>
		ScreenModel.create({
			alias: "template",
			grid: { type: "3x3", subtype: "equal" },
			items: [
				templateItem("image", "left"),
				templateItem("image", "right"),
				templateItem("audio", "center"),
			],
		});

	const buildScreenInput = () => ({
		image_1: new Types.ObjectId().toString(),
		image_2: new Types.ObjectId().toString(),
		audio_1: new Types.ObjectId().toString(),
	});

	beforeAll(async () => {
		await mongoose.connect(process.env.DB_URL || "");
	});

	afterAll(async () => {
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
	});

	beforeEach(async () => {
		await ScreenModel.deleteMany({});
	});

	describe(`POST ${Endpoints.ScreenFromTemplate}`, () => {
		it("requires authentication", async () => {
			const template = await seedTemplate();
			const res = await st(server.app)
				.post(`/api${Endpoints.ScreenFromTemplate}`)
				.send({ template_id: template._id.toString(), screens: [buildScreenInput()] });

			expect(res.statusCode).toBe(401);
		});

		it("creates one screen per provided entry", async () => {
			const template = await seedTemplate();
			const res = await st(server.app)
				.post(`/api${Endpoints.ScreenFromTemplate}`)
				.set("Cookie", cookie)
				.send({
					template_id: template._id.toString(),
					screens: [buildScreenInput(), buildScreenInput()],
				});

			expect(res.statusCode).toBe(201);
			const screens = res.body.content;
			expect(Array.isArray(screens)).toBe(true);
			expect(screens).toHaveLength(2);
			expect(screens[0].grid.type).toBe("3x3");
			expect(screens[0].items).toHaveLength(3);
			expect(
				screens[0].items.every((item: { type: string }) => item.type === "media")
			).toBe(true);
		});

		it("fails when a screen is missing required keys", async () => {
			const template = await seedTemplate();
			const res = await st(server.app)
				.post(`/api${Endpoints.ScreenFromTemplate}`)
				.set("Cookie", cookie)
				.send({
					template_id: template._id.toString(),
					screens: [{ image_1: new Types.ObjectId().toString() }],
				});

			expect(res.statusCode).toBe(400);
			expect(res.body.message).toBeTruthy();
		});

		it("returns 404 for a non-existent template", async () => {
			const res = await st(server.app)
				.post(`/api${Endpoints.ScreenFromTemplate}`)
				.set("Cookie", cookie)
				.send({
					template_id: new Types.ObjectId().toString(),
					screens: [buildScreenInput()],
				});

			expect(res.statusCode).toBe(404);
		});
	});
});
