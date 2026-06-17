/** @deprecated Use screen components instead of global experiment type */
export type ExperimentType = "mos" | "eyetrackingMos" | "textHighlighting";

export interface IExperiment {
	_id: string;
	alias: string;
	description?: string;
	/** @deprecated Use screen components instead */
	type?: ExperimentType;
	status?: "draft" | "running" | "completed";
	createdAt: string;
}

export interface IProject {
	_id: string;
	alias: string;
	description?: string;
	experiments: IExperiment[];
}

// export const projectsMock: IProject[] = [
// 	{
// 		_id: "p1",
// 		alias: "Project 1",
// 		description: "Just a description",
// 		experiments: [
// 			{
// 				_id: "e1",
// 				name: "Experiment A",
// 				description: "Baseline TTS pipeline",
// 				status: "completed",
// 				created_at: new Date().toISOString(),
// 			},
// 			{
// 				_id: "e2",
// 				name: "Experiment B",
// 				description: "Fine-tuned voice model",
// 				status: "running",
// 				created_at: new Date().toISOString(),
// 			},
// 		],
// 	},
// 	{
// 		_id: "p2",
// 		alias: "Project 2",
// 		description: "Just a description",
// 		experiments: [
// 			{
// 				_id: "e3",
// 				name: "Experiment C",
// 				description: "Low-latency inference",
// 				status: "draft",
// 				created_at: new Date().toISOString(),
// 			},
// 		],
// 	},
// 	{
// 		_id: "p3",
// 		alias: "Project 3",
// 		description: "Just a description",
// 		experiments: [
// 			{
// 				_id: "e4",
// 				name: "Experiment D",
// 				description: "Multi-speaker dataset",
// 				status: "completed",
// 				created_at: new Date().toISOString(),
// 			},
// 			{
// 				_id: "e5",
// 				name: "Experiment E",
// 				description: "Prosody control",
// 				status: "draft",
// 				created_at: new Date().toISOString(),
// 			},
// 			{
// 				_id: "e6",
// 				name: "Experiment F",
// 				description: "Noise robustness",
// 				status: "running",
// 				created_at: new Date().toISOString(),
// 			},
// 		],
// 	},
// ];
