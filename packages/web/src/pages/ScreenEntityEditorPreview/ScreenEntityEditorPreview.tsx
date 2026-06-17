import { useState } from "react";
import type { ScreenEntity } from "@/@types/screen.model";
import { ScreenEntityEditor } from "@/components/ScreenEntityEditor";

// const initialScreen: ScreenEntity = {
// 	uid: "screen-editor-preview",
// 	kind: "Screen",
// 	name: "Screen Editor Preview",
// 	props: {
// 		grid: { type: "3x3", subtype: "equal" },
// 	},
// 	children: [
// 		{
// 			uid: "text_1",
// 			kind: "Text",
// 			name: "Instructions",
// 			props: {
// 				text: "Listen to the audio, inspect the image, and rate the sample.",
// 				fontSize: 18,
// 				align: "center",
// 			},
// 			placement: { area: "heading", position: "UC", order: 0 },
// 			phase: "all",
// 		},
// 		{
// 			uid: "image_1",
// 			kind: "Image",
// 			name: "Reference Image",
// 			props: {
// 				imageSrc: "https://via.placeholder.com/320x180.png?text=Reference+Image",
// 				alt: "Reference image",
// 			},
// 			placement: { area: "content", position: "CL", order: 0 },
// 			phase: "all",
// 		},
// 		{
// 			uid: "audio_1",
// 			kind: "AudioPlayer",
// 			name: "Audio Sample",
// 			props: {
// 				audioSrc:
// 					"/samples/sample-audio.wav",
// 				label: "Sample Audio",
// 			},
// 			placement: { area: "content", position: "C", order: 0 },
// 			phase: "stimulus",
// 		},
// 		{
// 			uid: "rating_1",
// 			kind: "RatingScale",
// 			name: "MOS Rating",
// 			props: {
// 				prompt: "How natural is this speech sample?",
// 				scale: ["1", "2", "3", "4", "5"],
// 			},
// 			placement: { area: "footer", position: "C", order: 0 },
// 			phase: "response",
// 		},
// 		{
// 			uid: "continue_1",
// 			kind: "ContinueButton",
// 			name: "Continue",
// 			props: { label: "Next" },
// 			placement: { area: "footer", position: "BR", order: 1 },
// 			phase: "ready",
// 		},
// 	],
// 	behaviors: [
// 		{
// 			uid: "behavior_advance",
// 			kind: "AdvanceRule",
// 			name: "Continue To Advance",
// 			props: { when: "continue-click" },
// 		},
// 		{
// 			uid: "behavior_fixation",
// 			kind: "FixationGate",
// 			name: "Initial Fixation",
// 			props: { durationMs: 1000, reveal: "all-stimulus", hideCursor: false },
// 		},
// 	],
// };

const ScreenEntityEditorPreview: React.FC = () => {
	const [savedScreen, setSavedScreen] = useState<ScreenEntity | null>(null);

	return (
		<>
			<div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#f5f6fa" }}>
				<ScreenEntityEditor onSave={setSavedScreen} />
			</div>

			{savedScreen && (
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
					{JSON.stringify(savedScreen, null, 2)}
				</pre>
			)}
		</>
	);
};

export default ScreenEntityEditorPreview;
