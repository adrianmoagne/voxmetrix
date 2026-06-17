import { useState } from "react";
import type { ExperimentDefinition } from "@/@types/screen.model";
import { ExperimentEditor } from "@/components/ExperimentEditor";
import ExperimentEngineRuntime from "@/pages/ExperimentParticipantRuntime/ExperimentEngineRuntime";

const sampleExperiment: ExperimentDefinition = {
	schemaVersion: 2,
	uid: "exp-demo-001",
	name: "Audio Naturalness Study",
	description: "MOS rating experiment comparing TTS model outputs across conditions.",
	blocks: [
		{
			uid: "block-1",
			kind: "Block",
			name: "Audio Rating Trial",
			props: { description: "Participants hear audio and rate naturalness." },
			steps: [
				{
					uid: "fix-1",
					kind: "FixationStep",
					name: "Fixation",
					props: { durationMs: 1000, hideCursor: false },
				},
				{
					uid: "screen-1",
					kind: "Screen",
					name: "Rating Screen",
					props: { grid: { type: "3x3", subtype: "equal" } },
					children: [
						{
							uid: "audio-1",
							kind: "AudioPlayer",
							name: "Sample Audio",
							props: {
								audioSrc: { kind: "binding", column: "audio_src", required: true },
								autoplay: true,
							},
							placement: { area: "heading", position: "C", order: 0 },
							phase: "stimulus",
						},
						{
							uid: "rating-1",
							kind: "RatingScale",
							name: "MOS Rating",
							props: {
								prompt: { kind: "binding", column: "prompt", fallback: "Rate this sample." },
								scale: ["1", "2", "3", "4", "5"],
							},
							placement: { area: "content", position: "C", order: 0 },
							phase: "response",
						},
						{
							uid: "continue-1",
							kind: "ContinueButton",
							name: "Continue",
							props: { label: "Next" },
							placement: { area: "footer", position: "C", order: 0 },
							phase: "ready",
						},
					],
					behaviors: [
						{
							uid: "advance-1",
							kind: "AdvanceRule",
							name: "Advance on continue",
							props: { when: "continue-click" },
						},
						{
							uid: "audio-progress-1",
							kind: "AudioProgress",
							name: "Audio Progress",
							props: { label: "Audio" },
						},
					],
				},
			],
		},
		{
			uid: "block-2",
			kind: "Block",
			name: "Image Comparison",
			props: { description: "Side-by-side image comparison with eye tracking." },
			steps: [
				{
					uid: "cal-1",
					kind: "CalibrationStep",
					name: "Calibration",
					props: {},
				},
				{
					uid: "screen-2",
					kind: "Screen",
					name: "Image Pair",
					props: { grid: { type: "3x3", subtype: "equal" } },
					children: [
						{
							uid: "img-left",
							kind: "Image",
							name: "Left Image",
							props: {
								imageSrc: { kind: "binding", column: "image_left" },
							},
							placement: { area: "content", position: "CL", order: 0 },
							phase: "stimulus",
						},
						{
							uid: "img-right",
							kind: "Image",
							name: "Right Image",
							props: {
								imageSrc: { kind: "binding", column: "image_right" },
							},
							placement: { area: "content", position: "CR", order: 0 },
							phase: "stimulus",
						},
						{
							uid: "audio-5",
							kind: "AudioPlayer",
							name: "Sample Audio",
							props: {
								audioSrc: { kind: "binding", column: "audio_src", required: true },
								autoplay: true,
								hidden: true,
							},
							placement: { area: "heading", position: "C", order: 0 },
							phase: "stimulus",
						},
					],
					behaviors: [
						{
							uid: "balance-1",
							kind: "LateralCounterbalance",
							name: "Lateral Counterbalance",
							props: {
								columnA: "image_a",
								columnB: "image_b",
								leftColumn: "image_left",
								rightColumn: "image_right",
							},
						},
						{
							uid: "eye-1",
							kind: "EyeTracking",
							name: "Gaze Tracking",
							props: { startOn: "screen-enter", stopOn: "audio-end", targets: "all-trackable" },
						},
						{
							uid: "advance-2",
							kind: "AdvanceRule",
							name: "Advance on audio end",
							props: { when: "audio-ended" },
						},
					],
				},
			],
		},
		{
			uid: "block-3",
			kind: "Block",
			name: "Accent Similarity Highlighting",
			props: { description: "Participants compare three recordings and highlight the phrase evidence used to decide." },
			steps: [
				{
					uid: "screen-3",
					kind: "Screen",
					name: "Accent Similarity Comparison",
					props: { grid: { type: "3x3", subtype: "equal" } },
					children: [
						{
							uid: "text-reference-label",
							kind: "Text",
							name: "Reference Label",
							props: { text: "X (Reference)", fontSize: 18, align: "center" },
							placement: { area: "heading", position: "C", order: 0 },
							phase: "all",
						},
						{
							uid: "audio-reference",
							kind: "AudioPlayer",
							name: "Reference Audio",
							props: {
								audioSrc: { kind: "binding", column: "reference_audio", required: true },
							},
							placement: { area: "heading", position: "C", order: 1 },
							phase: "stimulus",
						},
						{
							uid: "text-option-a-label",
							kind: "Text",
							name: "Option A Label",
							props: { text: "A", fontSize: 16, align: "center" },
							placement: { area: "content", position: "C", order: 0 },
							phase: "all",
						},
						{
							uid: "audio-option-a",
							kind: "AudioPlayer",
							name: "Audio A",
							props: {
								audioSrc: { kind: "binding", column: "audio_a", required: true },
							},
							placement: { area: "content", position: "C", order: 1 },
							phase: "stimulus",
						},
						{
							uid: "text-option-b-label",
							kind: "Text",
							name: "Option B Label",
							props: { text: "B", fontSize: 16, align: "center" },
							placement: { area: "content", position: "C", order: 2 },
							phase: "all",
						},
						{
							uid: "audio-option-b",
							kind: "AudioPlayer",
							name: "Audio B",
							props: {
								audioSrc: { kind: "binding", column: "audio_b", required: true },
							},
							placement: { area: "content", position: "C", order: 3 },
							phase: "stimulus",
						},
						{
							uid: "rating-accent-match",
							kind: "RatingScale",
							name: "Closest Accent Choice",
							props: {
								prompt: { kind: "binding", column: "comparison_prompt", fallback: "Qual tem sotaque mais parecido com X?" },
								scale: ["A", "B"],
							},
							placement: { area: "content", position: "C", order: 4 },
							phase: "response",
						},
						{
							uid: "text-highlight-instructions",
							kind: "Text",
							name: "Highlight Instructions",
							props: {
								text: "Destaque apenas as partes da frase que ajudaram voce a decidir o quao semelhante e o sotaque entre as gravacoes. Evite selecionar a frase inteira; seja o mais preciso possivel.",
								fontSize: 18,
								align: "left",
							},
							placement: { area: "footer", position: "C", order: 0 },
							phase: "response",
						},
						{
							uid: "text-highlighter-accent-evidence",
							kind: "TextHighlighter",
							name: "Phrase Evidence",
							props: {
								text: { kind: "binding", column: "highlight_text", required: true },
								highlightColor: "rgba(255, 235, 59, 0.75)",
							},
							placement: { area: "footer", position: "C", order: 1 },
							phase: "response",
						},
						{
							uid: "continue-accent-comparison",
							kind: "ContinueButton",
							name: "Continue",
							props: { label: "Next" },
							placement: { area: "footer", position: "C", order: 2 },
							phase: "ready",
						},
					],
					behaviors: [
						{
							uid: "advance-accent-comparison",
							kind: "AdvanceRule",
							name: "Advance on continue",
							props: { when: "continue-click" },
						},
					],
				},
			],
		},
	],
	spreadsheet: {
		columns: [
			{ key: "audio_src", label: "Audio Source", type: "string" },
			{ key: "prompt", label: "Prompt", type: "string" },
			{ key: "image_left", label: "Left Image", type: "string" },
			{ key: "image_right", label: "Right Image", type: "string" },
			{ key: "image_a", label: "Stimulus A", type: "string" },
			{ key: "image_b", label: "Stimulus B", type: "string" },
			{ key: "reference_audio", label: "Reference Audio", type: "string" },
			{ key: "audio_a", label: "Audio A", type: "string" },
			{ key: "audio_b", label: "Audio B", type: "string" },
			{ key: "comparison_prompt", label: "Comparison Prompt", type: "string" },
			{ key: "highlight_text", label: "Highlight Text", type: "string" },
		],
		rows: [
			{
				uid: "row-1",
				blockUid: "block-1",
				shuffleGroup: "mos",
				values: {
					audio_src: "/samples/sample-audio.wav",
					prompt: "Rate the naturalness of this sample.",
					image_left: "",
					image_right: "",
					image_a: "",
					image_b: "",
					reference_audio: "",
					audio_a: "",
					audio_b: "",
					comparison_prompt: "",
					highlight_text: "",
				},
			},
			{
				uid: "row-2",
				blockUid: "block-1",
				shuffleGroup: "mos",
				values: {
					audio_src: "/samples/sample-audio.wav",
					prompt: "How natural does this sound?",
					image_left: "",
					image_right: "",
					image_a: "",
					image_b: "",
					reference_audio: "",
					audio_a: "",
					audio_b: "",
					comparison_prompt: "",
					highlight_text: "",
				},
			},
			{

				uid: "row-3",
				blockUid: "block-2",
				values: {
					audio_src: "/samples/sample-audio.wav",
					prompt: "teste",
					image_a: "/samples/sample-left.svg",
					image_b: "/samples/sample-right.svg",
					image_left: "",
					image_right: "",
					reference_audio: "",
					audio_a: "",
					audio_b: "",
					comparison_prompt: "",
					highlight_text: "",
				},
			},
			{
				uid: "row-4",
				blockUid: "block-3",
				values: {
					audio_src: "",
					prompt: "",
					image_left: "",
					image_right: "",
					image_a: "",
					image_b: "",
					reference_audio: "/samples/sample-audio.wav",
					audio_a: "/samples/sample-audio.wav",
					audio_b: "/samples/sample-audio.wav",
					comparison_prompt: "Qual tem sotaque mais parecido com X?",
					highlight_text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
				},
			},
		],
		shuffleMode: "within-group",
	},
};

const ExperimentEditorPreview: React.FC = () => {
	const [draft, setDraft] = useState<ExperimentDefinition>(sampleExperiment);
	const [isPreviewing, setIsPreviewing] = useState(false);
	const [saved, setSaved] = useState<ExperimentDefinition | null>(null);

	if (isPreviewing && draft) {
		return (
			<div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
				<ExperimentEngineRuntime
					experimentId={draft.uid}
					definition={draft}
					isPreview
					onExit={() => setIsPreviewing(false)}
				/>
			</div>
		);
	}

	return (
		<>
			<div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
				<ExperimentEditor
					experiment={draft}
					onSave={(def) => {
						setDraft(def);
						setSaved(def);
						console.log("Saved:", def);
					}}
					onRun={(def) => {
						setDraft(def);
						setIsPreviewing(true);
					}}
				/>
			</div>

			{saved && (
				<pre
					style={{
						margin: 0,
						padding: 16,
						background: "#111827",
						color: "#f9fafb",
						overflowX: "auto",
						fontSize: 12,
					}}
				>
					{JSON.stringify(saved, null, 2)}
				</pre>
			)}
		</>
	);
};

export default ExperimentEditorPreview;
