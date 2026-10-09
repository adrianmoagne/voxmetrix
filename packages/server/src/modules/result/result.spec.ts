import mongoose, { Types } from "mongoose";
import { gunzipSync } from "zlib";
import st from "supertest";
import { server } from "../../app";
import { buildAuthCookie } from "../../test-utils/auth";
import { ExperimentModel } from "../experiment/experiment.model";
import { decodeStored } from "./gaze-columns";
import { GazeCaptureModel } from "./gaze-capture.model";
import { ResultModel } from "./result.model";

// supertest types the response as superagent's; at runtime it is the raw stream.
const binaryParser = (res: any, callback: (error: Error | null, body: Buffer) => void) => {
	const chunks: Buffer[] = [];
	res.on("data", (chunk: Buffer) => chunks.push(chunk));
	res.on("end", () => callback(null, Buffer.concat(chunks)));
};

describe("Result routes", () => {
	const ownerId = new Types.ObjectId().toString();
	const ownerCookie = buildAuthCookie(ownerId);

	const gazeSamples = [
		{ x: 100, y: 200, t: 10, status: "ok", audioTime: 0.1 },
		{ x: null, y: null, t: 43, status: "no_face" },
	];
	const gazeCapture = { schemaVersion: 1, audioAnchors: [{ performanceTime: 10, contextTime: 0.1 }] };

	const submission = () => ({
		participant: { name: "P1", email: "p1@example.com" },
		browser_info: { windowWidth: 1280, windowHeight: 720, timeOrigin: 1791492580625.5 },
		steps: [
			{ screenUid: "calibration", responses: { calibration: { points_calibrated: 5 } } },
			{
				screenUid: "trial-1",
				responses: { rating: 4 },
				extras: {
					gazeData: gazeSamples,
					gazeCapture,
					targetBoundingBoxes: [{ entityUid: "image-1", boundingBox: { left: 0, top: 0 } }],
				},
			},
		],
	});

	const createExperiment = () =>
		ExperimentModel.create({
			alias: "Gaze",
			owner: ownerId,
			definition: {
				schemaVersion: 2,
				uid: "experiment-1",
				name: "Gaze",
				blocks: [],
				spreadsheet: { columns: [], rows: [] },
			},
		});

	const submit = (experimentId: unknown) =>
		st(server.app).post(`/api/experiments/${String(experimentId)}/results`).send(submission());

	beforeAll(async () => {
		await mongoose.connect(process.env.DB_URL || "");
	});

	afterAll(async () => {
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
	});

	beforeEach(async () => {
		await Promise.all([
			ExperimentModel.deleteMany({}),
			ResultModel.deleteMany({}),
			GazeCaptureModel.deleteMany({}),
		]);
	});

	it("stores gaze samples apart from the result", async () => {
		const experiment = await createExperiment();
		const res = await submit(experiment._id);
		expect(res.statusCode).toBe(201);

		const result = await ResultModel.findById(res.body.data.resultId).lean();
		expect(result!.browserInfo?.timeOrigin).toBe(1791492580625.5);
		const trial = result!.steps[1] as { extras: Record<string, unknown> };
		expect(trial.extras.gazeData).toBeUndefined();
		expect(trial.extras.gazeCapture).toBeUndefined();
		expect(trial.extras.gazeSummary).toEqual({
			storage: "gaze-capture",
			sampleCount: 2,
			validSampleCount: 1,
		});
		expect(trial.extras.targetBoundingBoxes).toHaveLength(1);

		const captures = await GazeCaptureModel.find({ result: result!._id }).lean();
		expect(captures).toHaveLength(1);
		expect(captures[0]).toMatchObject({ stepIndex: 1, screenUid: "trial-1" });
		expect(decodeStored(captures[0].samples)).toEqual(gazeSamples);
		const capture = captures[0].capture as Record<string, unknown>;
		expect(decodeStored(capture.audioAnchors)).toEqual(gazeCapture.audioAnchors);
	});

	it("lists results without gaze data, including legacy inline gaze", async () => {
		const experiment = await createExperiment();
		await submit(experiment._id);
		await ResultModel.create({ experiment: experiment._id, steps: submission().steps });

		const res = await st(server.app)
			.get(`/api/experiments/${experiment._id}/results`)
			.set("Cookie", ownerCookie);

		expect(res.statusCode).toBe(200);
		expect(res.body.count).toBe(2);
		for (const result of res.body.data) {
			expect(result.steps[1].extras.gazeData).toBeUndefined();
			expect(result.steps[1].extras.gazeCapture).toBeUndefined();
			expect(result.steps[1].extras.targetBoundingBoxes).toHaveLength(1);
		}
	});

	it("exports results with their gaze data restored", async () => {
		const experiment = await createExperiment();
		await submit(experiment._id);
		await submit(experiment._id);

		const res = await st(server.app)
			.get(`/api/experiments/${experiment._id}/results/export`)
			.set("Cookie", ownerCookie)
			.buffer(true)
			.parse(binaryParser);

		expect(res.statusCode).toBe(200);
		expect(res.headers["content-disposition"]).toContain(".json.gz");

		const exported = JSON.parse(gunzipSync(res.body).toString("utf8"));
		expect(exported).toHaveLength(2);
		for (const result of exported) {
			expect(result.participantEmail).toBe("p1@example.com");
			expect(result.steps[0]).toMatchObject(submission().steps[0]);
			expect(result.steps[1].extras.gazeData).toEqual(gazeSamples);
			expect(result.steps[1].extras.gazeCapture).toEqual(gazeCapture);
		}
	});

	it("only lets the owner export", async () => {
		const experiment = await createExperiment();

		const anonymous = await st(server.app).get(`/api/experiments/${experiment._id}/results/export`);
		expect(anonymous.statusCode).toBe(401);

		const otherUser = await st(server.app)
			.get(`/api/experiments/${experiment._id}/results/export`)
			.set("Cookie", buildAuthCookie());
		expect(otherUser.statusCode).toBe(403);
	});

	it("deletes gaze captures with their experiment", async () => {
		const experiment = await createExperiment();
		await submit(experiment._id);
		expect(await GazeCaptureModel.countDocuments()).toBe(1);

		const res = await st(server.app)
			.delete(`/api/experiments/${experiment._id}`)
			.set("Cookie", ownerCookie);

		expect(res.statusCode).toBe(204);
		expect(await GazeCaptureModel.countDocuments()).toBe(0);
		expect(await ResultModel.countDocuments()).toBe(0);
	});
});