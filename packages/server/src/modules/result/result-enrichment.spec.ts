import type { ExperimentDefinition, Placement } from "../experiment/experiment-definition.types";
import { enrichResultSteps, normalizeRatingOptions } from "./result-enrichment";

const basePlacement: Placement = {
	area: "content",
	position: "center",
	order: 0,
};

const buildDefinition = (): ExperimentDefinition => ({
	schemaVersion: 2,
	uid: "experiment-1",
	name: "MOS Experiment",
	description: "Audio rating experiment",
	blocks: [
		{
			uid: "block-1",
			kind: "Block",
			name: "Main Block",
			props: {},
			steps: [
				{
					uid: "screen-1",
					kind: "Screen",
					name: "Rating Screen",
					props: {
						grid: {
							type: "1x1",
							subtype: "equal",
						},
					},
					children: [
						{
							uid: "audio-1",
							kind: "AudioPlayer",
							name: "Reference Audio",
							props: {
								audioSrc: {
									kind: "binding",
									column: "audio_url",
								},
								label: {
									kind: "binding",
									column: "audio_label",
									fallback: "Fallback label",
								},
							},
							placement: basePlacement,
							phase: "stimulus",
						},
						{
							uid: "rating-1",
							kind: "RatingScale",
							name: "Naturalness Rating",
							props: {
								prompt: {
									kind: "binding",
									column: "prompt",
								},
								scale: ["1", "2", "3", "4", "5"],
								required: true,
							},
							placement: {
								...basePlacement,
								order: 1,
							},
							phase: "response",
						},
					],
					behaviors: [],
				},
			],
		},
	],
	spreadsheet: {
		columns: [
			{ key: "audio_url", label: "Audio URL", type: "string" },
			{ key: "audio_label", label: "Audio Label", type: "string" },
			{ key: "prompt", label: "Prompt", type: "string" },
		],
		rows: [
			{
				uid: "row-1",
				blockUid: "block-1",
				values: {
					audio_url: "https://example.com/audio-a.wav",
					audio_label: "Clip A",
					prompt: "How natural is this audio?",
				},
			},
		],
		shuffleMode: "none",
	},
});

const buildDefinitionWithScale = (scale: unknown): ExperimentDefinition => {
	const definition = buildDefinition();
	const screen = definition.blocks[0].steps[0];
	if (screen.kind !== "Screen") throw new Error("Expected the fixture's first step to be a screen");
	const rating = screen.children.find((child) => child.kind === "RatingScale");
	if (rating?.kind !== "RatingScale") throw new Error("Expected a RatingScale in the fixture");
	rating.props.scale = scale as typeof rating.props.scale;
	return definition;
};

const enrichRating = (
	definition: ExperimentDefinition,
	response: unknown,
	extra: Record<string, unknown> = {}
) => {
	const [step] = enrichResultSteps(
		[
			{
				screenUid: "screen-1",
				rowUid: "row-1",
				startedAt: 1000,
				completedAt: 7000,
				responses: { "rating-1": response },
				...extra,
			},
		],
		definition
	) as any[];
	return step.responseItems[0];
};

describe("result enrichment", () => {
	it("adds readable context while preserving the submitted step fields", () => {
		const audioTelemetry = {
			"audio-1": {
				started: true,
				completed: true,
				startedAtMs: 1200.25,
				completedAtMs: 6300.75,
			},
		};
		const responses = {
			"rating-1": "3",
			"orphan-response": "kept",
		};
		const extras = {
			gazeData: [{ x: 10, y: 20, t: 30 }],
		};

		const [step] = enrichResultSteps(
			[
				{
					screenUid: "screen-1",
					rowUid: "row-1",
					advanceReason: "responses-complete",
					startedAt: 1000,
					completedAt: 7000,
					responses,
					audioTelemetry,
					extras,
				},
			],
			buildDefinition()
		) as any[];

		expect(step.screenUid).toBe("screen-1");
		expect(step.rowUid).toBe("row-1");
		expect(step.responses).toEqual(responses);
		expect(step.audioTelemetry).toEqual(audioTelemetry);
		expect(step.extras).toEqual(extras);

		expect(step.block).toEqual({
			uid: "block-1",
			name: "Main Block",
		});
		expect(step.screen).toEqual({
			uid: "screen-1",
			name: "Rating Screen",
			kind: "Screen",
		});
		expect(step.row).toEqual({
			uid: "row-1",
			index: 0,
			blockUid: "block-1",
			values: {
				audio_url: "https://example.com/audio-a.wav",
				audio_label: "Clip A",
				prompt: "How natural is this audio?",
			},
		});
		expect(step.timing).toEqual({ durationMs: 6000 });

		expect(step.audios).toEqual([
			{
				entityUid: "audio-1",
				name: "Reference Audio",
				kind: "AudioPlayer",
				label: "Clip A",
				source: "https://example.com/audio-a.wav",
				telemetry: audioTelemetry["audio-1"],
				listenDurationMs: 5100.5,
			},
		]);
		expect(step.responseItems).toHaveLength(2);
		expect(step.responseItems[0]).toMatchObject({
			entityUid: "rating-1",
			name: "Naturalness Rating",
			kind: "RatingScale",
			prompt: "How natural is this audio?",
			scale: ["1", "2", "3", "4", "5"],
			value: "3",
			selectedIndex: 2,
		});
		expect(step.responseItems[1]).toEqual({
			entityUid: "orphan-response",
			kind: "Unknown",
			value: "kept",
		});
	});

	it("does not fail when a submitted step references missing definition data", () => {
		const [step] = enrichResultSteps(
			[
				{
					screenUid: "missing-screen",
					rowUid: "missing-row",
					startedAt: "not-a-number",
					completedAt: 500,
					responses: {
						"missing-response": "5",
					},
				},
			],
			buildDefinition()
		) as any[];

		expect(step.screenUid).toBe("missing-screen");
		expect(step.rowUid).toBe("missing-row");
		expect(step).not.toHaveProperty("block");
		expect(step).not.toHaveProperty("screen");
		expect(step).not.toHaveProperty("row");
		expect(step.timing).toEqual({ durationMs: undefined });
		expect(step.audios).toEqual([]);
		expect(step.responseItems).toEqual([
			{
				entityUid: "missing-response",
				kind: "Unknown",
				value: "5",
			},
		]);
	});

	it("scores current-format responses from the submitted option", () => {
		const definition = buildDefinitionWithScale([
			{ value: -3, label: "Much worse" },
			{ value: 0, label: "About the same" },
			{ value: 3, label: "Much better" },
		]);

		const item = enrichRating(definition, { index: 0, value: -3, label: "Much worse" });

		expect(item).toMatchObject({ selectedIndex: 0, score: -3, label: "Much worse" });
	});

	it("scores legacy label responses with the matching option's value", () => {
		const definition = buildDefinitionWithScale([
			{ value: 0, label: "Bad" },
			{ value: 10, label: "Good" },
		]);

		const item = enrichRating(definition, "Good");

		expect(item).toMatchObject({ value: "Good", selectedIndex: 1, score: 10, label: "Good" });
	});

	it("keeps the submitted score when the scale was edited after the participant answered", () => {
		const definition = buildDefinitionWithScale(["1", "2", "3", "4", "5"]);

		const item = enrichRating(definition, { index: 4, value: 7, label: "Seven" });

		expect(item).toMatchObject({ selectedIndex: 4, score: 7, label: "Seven" });
	});

	it("attaches response telemetry and the time to confirm", () => {
		const telemetry = { selectionCount: 2, firstSelectedAtMs: 6500, completedAtMs: 6900.5 };

		const item = enrichRating(buildDefinition(), { index: 2, value: 3, label: "3" }, {
			responseTelemetry: { "rating-1": telemetry },
		});

		expect(item.telemetry).toEqual(telemetry);
		expect(item.confirmedAfterMs).toBe(5900.5);
	});

	it("normalizes mixed legacy and option scales without shifting indexes", () => {
		expect(
			normalizeRatingOptions(["Bad", { value: 10, label: "Good" }, { label: "No score" }])
		).toEqual([
			{ value: 1, label: "Bad" },
			{ value: 10, label: "Good" },
			{ value: 3, label: "No score" },
		]);
		expect(normalizeRatingOptions(undefined)).toEqual([]);
	});

	it("reports the audio each shuffled entity actually played", () => {
		const definition = buildDefinition();
		const screen = definition.blocks[0].steps[0];
		if (screen.kind !== "Screen") throw new Error("Expected the fixture's first step to be a screen");
		screen.children = [
			{
				uid: "audio-a",
				kind: "AudioPlayer",
				name: "Audio A",
				props: { audioSrc: { kind: "binding", column: "system_1" } },
				placement: basePlacement,
				phase: "stimulus",
			},
			{
				uid: "audio-b",
				kind: "AudioPlayer",
				name: "Audio B",
				props: { audioSrc: { kind: "binding", column: "system_2" } },
				placement: { ...basePlacement, order: 1 },
				phase: "stimulus",
			},
		];
		definition.spreadsheet.rows[0].values = {
			system_1: "https://example.com/model-1.wav",
			system_2: "https://example.com/model-2.wav",
		};
		const shuffle = {
			assignments: [
				{ entityUid: "audio-a", entityName: "Audio A", column: "system_1", shownColumn: "system_2" },
				{ entityUid: "audio-b", entityName: "Audio B", column: "system_2", shownColumn: "system_1" },
			],
		};

		const [step] = enrichResultSteps(
			[{ screenUid: "screen-1", rowUid: "row-1", startedAt: 0, completedAt: 1, responses: {}, shuffle }],
			definition
		) as any[];

		expect(step.shuffle).toEqual(shuffle);
		expect(step.audios).toMatchObject([
			{ entityUid: "audio-a", source: "https://example.com/model-2.wav", shownColumn: "system_2" },
			{ entityUid: "audio-b", source: "https://example.com/model-1.wav", shownColumn: "system_1" },
		]);
	});
});
