import { decodeStored } from "./gaze-columns";
import { attachGazeCaptures, splitGazeCaptures } from "./gaze-storage";

const sample = (x: number | null, y: number | null) => ({ x, y, t: 1, status: x === null ? "no_face" : "ok" });

const buildSteps = () => [
	{ screenUid: "instructions", responses: {} },
	{
		screenUid: "trial-1",
		rowUid: "row-1",
		responses: { rating: 4 },
		extras: {
			gazeData: [sample(10, 20), sample(null, null), sample(30, 40)],
			gazeCapture: { schemaVersion: 1, audioAnchors: [{ performanceTime: 1 }] },
			targetBoundingBoxes: [{ entityUid: "image-1", boundingBox: { left: 0 } }],
			gazeContext: { calibrationIndex: 1 },
		},
	},
];

describe("splitGazeCaptures", () => {
	it("moves gaze samples and capture metadata out of the steps", () => {
		const { steps, captures } = splitGazeCaptures(buildSteps());

		expect(captures).toHaveLength(1);
		expect(captures[0]).toMatchObject({ stepIndex: 1, screenUid: "trial-1", rowUid: "row-1" });
		expect(decodeStored(captures[0].samples)).toEqual(buildSteps()[1].extras!.gazeData);
		const capture = captures[0].capture as Record<string, unknown>;
		expect(capture.schemaVersion).toBe(1);
		expect(decodeStored(capture.audioAnchors)).toEqual([{ performanceTime: 1 }]);
		expect(steps[0]).toEqual(buildSteps()[0]);
		expect(steps[1].extras).toEqual({
			targetBoundingBoxes: [{ entityUid: "image-1", boundingBox: { left: 0 } }],
			gazeContext: { calibrationIndex: 1 },
			gazeSummary: { storage: "gaze-capture", sampleCount: 3, validSampleCount: 2 },
		});
	});

	it("leaves steps without gaze untouched", () => {
		const steps = [{ screenUid: "a", extras: { targetBoundingBoxes: [] } }];
		expect(splitGazeCaptures(steps)).toEqual({ steps, captures: [] });
	});
});

describe("attachGazeCaptures", () => {
	it("restores the steps as they were submitted, plus the summary", () => {
		const { steps, captures } = splitGazeCaptures(buildSteps());
		const restored = attachGazeCaptures({ _id: "result-1", steps }, captures);

		expect(restored.steps[0]).toEqual(buildSteps()[0]);
		expect(restored.steps[1]).toEqual({
			...buildSteps()[1],
			extras: {
				...buildSteps()[1].extras,
				gazeSummary: { storage: "gaze-capture", sampleCount: 3, validSampleCount: 2 },
			},
		});
	});

	it("keeps legacy inline gaze when nothing is stored separately", () => {
		const result = { steps: buildSteps() };
		expect(attachGazeCaptures(result, [])).toBe(result);
	});
});