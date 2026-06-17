import type { ExperimentDefinition } from "@/@types/screen.model";
import ExperimentEngineRuntime from "@/pages/ExperimentParticipantRuntime/ExperimentEngineRuntime";

// const testDefinition: ExperimentDefinition = {
// 	schemaVersion: 2,
// 	uid: "test-experiment",
// 	name: "Engine Test Experiment",
// 	description: "Test definition for verifying entity rendering",
// 	blocks: [
// 		{
// 			uid: "block_trial",
// 			kind: "Block",
// 			name: "Audio Rating Trial",
// 			props: {},
// 			steps: [
// 				{
// 					uid: "fix_1",
// 					kind: "FixationStep",
// 					name: "Fixation",
// 					props: { durationMs: 1500 },
// 				},
// 				{
// 					uid: "screen_1",
// 					kind: "Screen",
// 					name: "Audio Rating Screen",
// 					props: {
// 						grid: { type: "3x3", subtype: "equal" },
// 					},
// 					children: [
// 						{
// 							uid: "text_1",
// 							kind: "Text",
// 							name: "Instructions",
// 							props: { text: "Listen to the audio and rate its quality" },
// 							placement: { area: "heading", position: "UC", order: 0 },
// 							phase: "all" as const,
// 						},
// 						{
// 							uid: "audio_1",
// 							kind: "AudioPlayer",
// 							name: "Audio",
// 							props: {
// 								audioSrc: { kind: "binding" as const, column: "audio_file", fallback: "/samples/sample-audio.wav" },
// 							},
// 							placement: { area: "content", position: "C", order: 0 },
// 							phase: "stimulus" as const,
// 						},
// 						{
// 							uid: "audio_2",
// 							kind: "AudioPlayer",
// 							name: "Audio",
// 							props: {
// 								audioSrc: { kind: "binding" as const, column: "audio_file", fallback: "/samples/sample-audio.wav" },
// 							},
// 							placement: { area: "content", position: "C", order: 1 },
// 							phase: "stimulus" as const,
// 						},
// 						{
// 							uid: "rating_1",
// 							kind: "RatingScale",
// 							name: "Quality Rating",
// 							props: {
// 								prompt: "Rate the audio quality:",
// 								scale: ["1 - Bad", "2 - Poor", "3 - Fair", "4 - Good", "5 - Excellent"],
// 							},
// 							placement: { area: "footer", position: "C", order: 0 },
// 							phase: "response" as const,
// 						},
// 						{
// 							uid: "text_highlight_1",
// 							kind: "TextHighlighter",
// 							name: "Highlight Instructions",
// 							props: {
// 								text: "Please select a rating before continuing.",
// 								highlightColor: "rgba(255, 0, 0, 0.5)",
// 							},
// 							placement: { area: "footer", position: "C", order: 1 },
// 							phase: "response" as const,
// 						},
// 						{
// 							uid: "continue_1",
// 							kind: "ContinueButton",
// 							name: "Continue",
// 							props: { label: "Next" },
// 							placement: { area: "footer", position: "C", order: 1 },
// 							phase: "ready" as const,
// 						},
// 					],
// 					behaviors: [
// 						{
// 							uid: "advance_1",
// 							kind: "AdvanceRule",
// 							name: "Advance on click",
// 							props: { when: "continue-click" as const },
// 						},
// 					],
// 				},
// 			],
// 		},
// 	],
// 	spreadsheet: {
// 		columns: [{ key: "audio_file", label: "Audio File" }],
// 		rows: [
// 			{
// 				uid: "row_1",
// 				blockUid: "block_trial",
// 				values: {},
// 			},
// 			{
// 				uid: "row_2",
// 				blockUid: "block_trial",
// 				values: {},
// 			},
// 		],
// 	},
// };

const testDefinition: ExperimentDefinition = {
	schemaVersion: 2,
	uid: "test-experiment-eyetracking",
	name: "Engine Eye Tracking Test",
	description: "Hardcoded eye-tracking integration scenario",
	blocks: [
		{
			uid: "block_setup",
			kind: "Block",
			name: "Eye Tracking Setup",
			props: {},
			steps: [
				{
					uid: "calibration_1",
					kind: "CalibrationStep",
					name: "Calibration",
					props: {},
				},
				{
					uid: "validation_1",
					kind: "ValidationStep",
					name: "Validation",
					props: {},
				},
			],
		},
		{
			uid: "block_trial",
			kind: "Block",
			name: "Tracked Trial",
			props: {},
			steps: [
				{
					uid: "fix_1",
					kind: "FixationStep",
					name: "Fixation",
					props: { durationMs: 1000 },
				},
				{
					uid: "screen_1",
					kind: "Screen",
					name: "Tracked Audio Image Screen",
					props: {
						grid: { type: "3x3", subtype: "equal" },
					},
					children: [
						{
							uid: "image_left",
							kind: "Image",
							name: "Left Target",
							props: {
								imageSrc: {
									kind: "binding" as const,
									column: "left_image",
									required: true,
								},
								alt: "Left target image",
							},
							trackingTarget: { id: "left-target" },
							placement: { area: "content", position: "CL", order: 0 },
							phase: "all" as const,
						},
						{
							uid: "audio_1",
							kind: "AudioPlayer",
							name: "Audio",
							props: {
								audioSrc: {
									kind: "binding" as const,
									column: "audio_file",
									required: true,
								},
								autoplay: true,
								hidden: true,
							},
							placement: { area: "content", position: "C", order: 0 },
							phase: "stimulus" as const,
						},
						{
							uid: "image_right",
							kind: "Image",
							name: "Right Target",
							props: {
								imageSrc: {
									kind: "binding" as const,
									column: "right_image",
									required: true,
								},
								alt: "Right target image",
							},
							trackingTarget: { id: "right-target" },
							placement: { area: "content", position: "CR", order: 0 },
							phase: "all" as const,
						},
					],
					behaviors: [
						{
							uid: "eye_tracking_1",
							kind: "EyeTracking",
							name: "Track gaze during the trial",
							props: {
								startOn: "audio-start" as const,
								stopOn: "audio-end" as const,
								targets: "all-trackable" as const,
								hideCursor: true,
								calibrationPolicy: "once-before-first" as const,
							},
						},
						{
							uid: "advance_1",
							kind: "AdvanceRule",
							name: "Advance on click",
							props: { when: "audio-ended" as const },
						},
					],
				},
			],
		},
	],
	spreadsheet: {
		columns: [
			{ key: "audio_file", label: "Audio File" },
			{ key: "instruction_text", label: "Instruction Text" },
			{ key: "rating_prompt", label: "Rating Prompt" },
			{ key: "left_image", label: "Left Image" },
			{ key: "right_image", label: "Right Image" },
		],
		rows: [
			{
				uid: "row_setup",
				blockUid: "block_setup",
				values: {},
			},
			{
				uid: "row_trial_1",
				blockUid: "block_trial",
				values: {
					audio_file:
						"/samples/sample-audio.wav",
					instruction_text: "Listen to the sample, inspect both images, then rate the audio.",
					rating_prompt: "How natural is this speech sample?",
					left_image: "/samples/sample-left.svg",
					right_image: "/samples/sample-right.svg",
				},
			},
			{
				uid: "row_trial_2",
				blockUid: "block_trial",
				values: {
					audio_file:
						"/samples/sample-audio.wav",
					instruction_text: "Second pass: play the audio again and compare where you look.",
					rating_prompt: "How intelligible is this speech sample?",
					left_image: "/samples/sample-left.svg",
					right_image: "/samples/sample-right.svg",
				},
			},
		],
	},
};

const ExperimentEnginePreview = () => {
	return (
		<ExperimentEngineRuntime
			experimentId="test"
			definition={testDefinition}
			isPreview
		/>
	);
};

export default ExperimentEnginePreview;
