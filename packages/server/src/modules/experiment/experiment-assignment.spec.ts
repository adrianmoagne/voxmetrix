import type { ExperimentDefinition } from "../experiment/experiment-definition.types";
import {
	collectConditionGroups,
	pickRandomCondition,
	resolveParticipantCondition,
	ParticipantConditionError,
} from "./experiment-assignment";

const buildDefinition = (
	overrides: Partial<ExperimentDefinition> = {}
): ExperimentDefinition => ({
	schemaVersion: 2,
	uid: "exp-1",
	name: "Test",
	blocks: [],
	spreadsheet: {
		columns: [],
		rows: [],
		shuffleMode: "none",
	},
	...overrides,
});

describe("experiment-assignment", () => {
	describe("collectConditionGroups", () => {
		it("returns unique sorted conditions from spreadsheet rows", () => {
			const definition = buildDefinition({
				spreadsheet: {
					columns: [],
					rows: [
						{ uid: "r1", blockUid: "b1", values: {}, condition: "B" },
						{ uid: "r2", blockUid: "b1", values: {}, condition: "A" },
						{ uid: "r3", blockUid: "b1", values: {}, condition: "A" },
						{ uid: "r4", blockUid: "b1", values: {} },
					],
				},
			});

			expect(collectConditionGroups(definition)).toEqual(["A", "B"]);
		});
	});

	describe("resolveParticipantCondition", () => {
		it("returns undefined when assignment is disabled", () => {
			const definition = buildDefinition({
				spreadsheet: {
					columns: [],
					rows: [{ uid: "r1", blockUid: "b1", values: {}, condition: "A" }],
				},
			});

			expect(resolveParticipantCondition(definition)).toBeUndefined();
		});

		it("reuses an existing valid assignment", () => {
			const definition = buildDefinition({
				participantAssignment: { enabled: true, mode: "random", groups: ["A", "B"] },
			});

			expect(
				resolveParticipantCondition(definition, { existingCondition: "B" })
			).toBe("B");
		});

		it("uses url condition when mode is url", () => {
			const definition = buildDefinition({
				participantAssignment: { enabled: true, mode: "url", groups: ["A", "B"] },
			});

			expect(
				resolveParticipantCondition(definition, { urlCondition: "A" })
			).toBe("A");
		});

		it("rejects invalid url conditions instead of falling back to random", () => {
			const definition = buildDefinition({
				participantAssignment: { enabled: true, mode: "url", groups: ["B"] },
			});

			expect(() =>
				resolveParticipantCondition(definition, { urlCondition: "A" })
			).toThrow(ParticipantConditionError);
		});

		it("falls back to spreadsheet conditions when groups are omitted", () => {
			const definition = buildDefinition({
				participantAssignment: { enabled: true, mode: "random" },
				spreadsheet: {
					columns: [],
					rows: [{ uid: "r1", blockUid: "b1", values: {}, condition: "A" }],
				},
			});

			const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
			expect(resolveParticipantCondition(definition)).toBe("A");
			randomSpy.mockRestore();
		});

		it("reassigns when an existing condition is no longer available", () => {
			const definition = buildDefinition({
				participantAssignment: { enabled: true, mode: "random", groups: ["B"] },
			});

			const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
			expect(
				resolveParticipantCondition(definition, { existingCondition: "A" })
			).toBe("B");
			randomSpy.mockRestore();
		});
	});

	describe("pickRandomCondition", () => {
		it("throws for empty groups", () => {
			expect(() => pickRandomCondition([])).toThrow(ParticipantConditionError);
		});
	});
});
