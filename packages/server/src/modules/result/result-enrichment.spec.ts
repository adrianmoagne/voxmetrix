import type { ExperimentDefinition, Placement } from "../experiment/experiment-definition.types";
import { enrichResultSteps } from "./result-enrichment";

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
});
