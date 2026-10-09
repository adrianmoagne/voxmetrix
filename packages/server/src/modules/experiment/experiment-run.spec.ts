import mongoose, { Types } from "mongoose";
import st from "supertest";
import { server } from "../../app";
import { ExperimentModel } from "./experiment.model";

describe("Participant start", () => {
	let experimentId: string;

	const run = (email: string, condition?: string) =>
		st(server.app)
			.get(`/api/experiments/${experimentId}/run`)
			.query({ email, ...(condition ? { condition } : {}) });

	interface ParticipantEntry {
		email: string;
		status: string;
		assignedCondition?: string;
	}

	const participants = async () =>
		(await ExperimentModel.findById(experimentId).lean())!.participants as ParticipantEntry[];

	beforeAll(async () => {
		await mongoose.connect(process.env.DB_URL || "");
	});

	afterAll(async () => {
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
	});

	beforeEach(async () => {
		await ExperimentModel.deleteMany({});
		const experiment = await ExperimentModel.create({
			alias: "Assigned",
			owner: new Types.ObjectId(),
			definition: {
				schemaVersion: 2,
				uid: "experiment-1",
				name: "Assigned",
				blocks: [],
				spreadsheet: { columns: [], rows: [] },
				participantAssignment: { enabled: true, mode: "url", groups: ["A", "B"] },
			},
		});
		experimentId = String(experiment._id);
	});

	it("adds a new participant as started with the URL condition", async () => {
		const res = await run("Ana@Example.com", "A");

		expect(res.statusCode).toBe(200);
		expect(res.body.data.participantCondition).toBe("A");
		expect(await participants()).toEqual([
			expect.objectContaining({ email: "ana@example.com", status: "started", assignedCondition: "A" }),
		]);
	});

	it("keeps a returning participant's condition", async () => {
		await run("ana@example.com", "A");
		const res = await run("ana@example.com", "B");

		expect(res.body.data.participantCondition).toBe("A");
		expect(await participants()).toHaveLength(1);
	});

	it("records the participant without a condition when the URL condition is invalid", async () => {
		const res = await run("ana@example.com", "Z");

		expect(res.statusCode).toBe(400);
		const [entry] = await participants();
		expect(entry).toMatchObject({ email: "ana@example.com", status: "invited" });
		expect(entry.assignedCondition).toBeUndefined();
	});

	it("handles new and returning participants starting at the same moment", async () => {
		const returning = Array.from({ length: 10 }, (_, i) => `returning${i}@example.com`);
		const fresh = Array.from({ length: 10 }, (_, i) => `new${i}@example.com`);
		await ExperimentModel.updateOne(
			{ _id: experimentId },
			{ $set: { participants: returning.map((email) => ({ email, status: "invited" })) } }
		);

		const responses = await Promise.all(
			[...returning, ...fresh, ...fresh].map((email, i) => run(email, i % 2 ? "A" : "B"))
		);

		expect(responses.map((res) => res.statusCode)).toEqual(responses.map(() => 200));
		const entries = await participants();
		expect(entries.map((entry) => entry.email).sort()).toEqual([...returning, ...fresh].sort());
		for (const entry of entries) {
			expect(entry).toMatchObject({ status: "started", assignedCondition: expect.any(String) });
		}
	});
});