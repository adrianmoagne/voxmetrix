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

describe("Result sessions", () => {
	const ownerId = new Types.ObjectId().toString();
	const ownerCookie = buildAuthCookie(ownerId);
	const email = "ana@example.com";

	const plan = [
		{ planIndex: 0, stepUid: "instructions", rowUid: "row-0" },
		{ planIndex: 1, stepUid: "trial", rowUid: "row-1" },
		{ planIndex: 2, stepUid: "trial", rowUid: "row-2" },
	];

	const trialStep = (planIndex: number, rating: number) => ({
		screenUid: "trial",
		planIndex,
		responses: { rating },
		extras: {
			gazeData: [{ x: 1, y: 2, t: 3, status: "ok" }],
			gazeCapture: { schemaVersion: 1 },
		},
	});

	let experimentId: string;

	const base = () => `/api/experiments/${experimentId}/sessions`;

	const startSession = async () => {
		const res = await st(server.app)
			.post(base())
			.send({
				participant: { name: "Ana", email },
				participantCondition: "G1",
				browser_info: { windowWidth: 1280, windowHeight: 720, timeOrigin: 1000 },
				seed: 12345,
				plan,
			});
		expect(res.statusCode).toBe(201);
		return res.body.data as { resultId: string; token: string };
	};

	const saveStep = (session: { resultId: string; token: string }, seq: number, step: object) =>
		st(server.app)
			.put(`${base()}/${session.resultId}/steps/${seq}`)
			.set("X-Session-Token", session.token)
			.send({ step });

	const complete = (session: { resultId: string; token: string }, stepCount: number) =>
		st(server.app)
			.post(`${base()}/${session.resultId}/complete`)
			.set("X-Session-Token", session.token)
			.send({ stepCount });

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
		const experiment = await ExperimentModel.create({
			alias: "Sessions",
			owner: ownerId,
			definition: {
				schemaVersion: 2,
				uid: "experiment-1",
				name: "Sessions",
				blocks: [],
				spreadsheet: { columns: [], rows: [] },
			},
			participants: [{ email, status: "started" }],
		});
		experimentId = String(experiment._id);
	});

	it("starts an in-progress session holding the seed and plan", async () => {
		const session = await startSession();
		expect(session.token).toEqual(expect.any(String));

		const result = await ResultModel.findById(session.resultId).select("+sessionTokenHash").lean();
		expect(result).toMatchObject({
			status: "in_progress",
			seed: 12345,
			plan,
			participantEmail: email,
			participantCondition: "G1",
			steps: [],
		});
		expect(result!.completedAt).toBeUndefined();
		expect(result!.sessionTokenHash).not.toBe(session.token);
	});

	it("rejects a session without a valid seed and plan", async () => {
		const noSeed = await st(server.app).post(base()).send({ plan });
		expect(noSeed.statusCode).toBe(400);

		const badPlan = await st(server.app)
			.post(base())
			.send({ seed: 1, plan: [{ planIndex: 3, stepUid: "x" }] });
		expect(badPlan.statusCode).toBe(400);
	});

	it("only writes with the session's token", async () => {
		const session = await startSession();

		const noToken = await st(server.app)
			.put(`${base()}/${session.resultId}/steps/0`)
			.send({ step: trialStep(0, 1) });
		expect(noToken.statusCode).toBe(404);

		const wrongToken = await saveStep({ ...session, token: "not-the-token" }, 0, trialStep(0, 1));
		expect(wrongToken.statusCode).toBe(404);
		expect((await ResultModel.findById(session.resultId).lean())!.steps).toEqual([]);
	});

	it("saves each step at its position, with gaze stored apart", async () => {
		const session = await startSession();

		expect((await saveStep(session, 1, trialStep(1, 3))).statusCode).toBe(200);
		expect((await saveStep(session, 0, { screenUid: "instructions", planIndex: 0 })).statusCode).toBe(200);
		// A retry overwrites rather than appends.
		expect((await saveStep(session, 1, trialStep(1, 4))).statusCode).toBe(200);

		const result = await ResultModel.findById(session.resultId).lean();
		const steps = result!.steps as Array<Record<string, any>>;
		expect(steps).toHaveLength(2);
		expect(steps[0].screenUid).toBe("instructions");
		expect(steps[1].responses).toEqual({ rating: 4 });
		expect(steps[1].extras.gazeData).toBeUndefined();
		expect(steps[1].extras.gazeSummary).toMatchObject({ sampleCount: 1 });

		const captures = await GazeCaptureModel.find({ result: session.resultId }).lean();
		expect(captures).toHaveLength(1);
		expect(captures[0].stepIndex).toBe(1);
		expect(decodeStored(captures[0].samples)).toEqual([{ x: 1, y: 2, t: 3, status: "ok" }]);
	});

	it("tells a returning browser where to resume", async () => {
		const session = await startSession();
		await saveStep(session, 0, { screenUid: "instructions", planIndex: 0 });
		await saveStep(session, 1, trialStep(1, 3));
		// A recalibration step has no plan index; a gap stops the resume point.
		await saveStep(session, 3, trialStep(2, 5));

		const res = await st(server.app)
			.get(`${base()}/${session.resultId}`)
			.set("X-Session-Token", session.token);

		expect(res.statusCode).toBe(200);
		expect(res.body.data).toMatchObject({
			status: "in_progress",
			seed: 12345,
			plan,
			participantCondition: "G1",
			participant: { name: "Ana", email },
			savedStepCount: 2,
			lastPlanIndex: 1,
		});

		const resume = await st(server.app)
			.post(`${base()}/${session.resultId}/resumes`)
			.set("X-Session-Token", session.token)
			.send({ fromSeq: 2, fromPlanIndex: 2, browser_info: { windowWidth: 1024, windowHeight: 768 } });
		expect(resume.statusCode).toBe(200);

		const result = await ResultModel.findById(session.resultId).lean();
		expect(result!.resumes).toEqual([
			expect.objectContaining({ fromSeq: 2, fromPlanIndex: 2, windowWidth: 1024, windowHeight: 768 }),
		]);
	});

	it("completes only when every step is saved", async () => {
		const session = await startSession();
		await saveStep(session, 0, { screenUid: "instructions", planIndex: 0 });
		await saveStep(session, 2, trialStep(2, 5));

		const early = await complete(session, 3);
		expect(early.statusCode).toBe(409);
		expect(early.body).toMatchObject({ message: "MISSING_STEPS", missing: [1] });

		await saveStep(session, 1, trialStep(1, 3));
		expect((await complete(session, 3)).statusCode).toBe(200);
		// Completing again is harmless.
		expect((await complete(session, 3)).statusCode).toBe(200);

		const result = await ResultModel.findById(session.resultId).lean();
		expect(result!.status).toBe("completed");
		expect(result!.completedAt).toBeInstanceOf(Date);

		const experiment = await ExperimentModel.findById(experimentId).lean();
		expect(experiment!.participants[0]).toMatchObject({ email, status: "completed" });

		const lateWrite = await saveStep(session, 3, trialStep(2, 1));
		expect(lateWrite.statusCode).toBe(409);
	});

	it("keeps unfinished sessions out of the default listing but in the export", async () => {
		const unfinished = await startSession();
		await saveStep(unfinished, 0, trialStep(0, 2));
		const finished = await startSession();
		await saveStep(finished, 0, trialStep(0, 4));
		await complete(finished, 1);

		const listed = await st(server.app)
			.get(`/api/experiments/${experimentId}/results`)
			.set("Cookie", ownerCookie);
		expect(listed.body.data.map((r: { _id: string }) => r._id)).toEqual([finished.resultId]);
		expect(listed.body.data[0].sessionTokenHash).toBeUndefined();

		const inProgress = await st(server.app)
			.get(`/api/experiments/${experimentId}/results?status=in_progress`)
			.set("Cookie", ownerCookie);
		expect(inProgress.body.data.map((r: { _id: string }) => r._id)).toEqual([unfinished.resultId]);

		const exported = await st(server.app)
			.get(`/api/experiments/${experimentId}/results/export`)
			.set("Cookie", ownerCookie)
			.buffer(true)
			.parse(binaryParser);
		const results = JSON.parse(gunzipSync(exported.body).toString("utf8"));
		expect(results.map((r: { status: string }) => r.status).sort()).toEqual(["completed", "in_progress"]);
		for (const result of results) {
			expect(result.sessionTokenHash).toBeUndefined();
			expect(result.steps[0].extras.gazeData).toHaveLength(1);
		}
	});

	it("marks the participant completed after a whole-session submission", async () => {
		const res = await st(server.app)
			.post(`/api/experiments/${experimentId}/results`)
			.send({ participant: { email: "ANA@example.com" }, steps: [trialStep(0, 3)] });
		expect(res.statusCode).toBe(201);

		const experiment = await ExperimentModel.findById(experimentId).lean();
		expect(experiment!.participants[0]).toMatchObject({ email, status: "completed" });
	});
});