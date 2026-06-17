export type GridType = "1x1" | "2x2" | "3x3";
export type GridSubtype = "equal" | "v_centered" | "h_centered";
export type ScreenItemType = "media" | "form" | "text" | "template";
export type TemplateType = "image" | "audio" | "text";
export type ScreenItemPosition = "center" | "left" | "right";
export type ItemArea = "heading" | "content" | "footer";
export type HAlign = "center" | "left" | "right";
export type VAlign = "top" | "center" | "bottom";
import type { IMedia } from "./medias.model";
import type { IForm } from "./forms.model";
import type { ItemPosition } from "./slices.model";
export type { ItemPosition };

// --- Binding utility ---

export interface BindingRef<T = string> {
	kind: "binding";
	column: string;
	fallback?: T;
	required?: boolean;
}

export type Bound<T> = T | BindingRef<T>;

// --- Placement (grid cell positioning) ---

export interface Placement {
	area: ItemArea;
	position: ItemPosition;
	order: number;
	hAlign?: HAlign;
	vAlign?: VAlign;
}

// --- Base entity generic ---

export interface BaseEntity<K extends string, P> {
	uid: string;
	kind: K;
	name: string;
	props: P;
	enabled?: Bound<boolean>;
}

// --- Eye-tracking target capability ---

export interface Trackable {
	trackingTarget?: {
		id: string;
		label?: Bound<string>;
	};
}

// --- Screen child entities (visible, placed on grid) ---

export type ScreenChildEntity =
	| (BaseEntity<
			"AudioPlayer",
			{
				audioSrc: Bound<string>;
				label?: Bound<string>;
				autoplay?: Bound<boolean>;
				hidden?: Bound<boolean>;
			}
	  > & {
			placement: Placement;
			phase?: "stimulus";
	  })
	| (BaseEntity<
			"Image",
			{
				imageSrc: Bound<string>;
				alt?: Bound<string>;
			}
	  > & {
			placement: Placement;
			phase?: "stimulus" | "response" | "all";
	  } & Trackable)
	| (BaseEntity<
			"Text",
			{
				text: Bound<string>;
				fontSize?: Bound<number>;
				align?: Bound<"left" | "center" | "right">;
			}
	  > & {
			placement: Placement;
			phase?: "stimulus" | "response" | "all";
	  } & Trackable)
	| (BaseEntity<
			"RatingScale",
			{
				prompt: Bound<string>;
				scale: Bound<string[]>;
				required?: Bound<boolean>;
			}
	  > & {
			placement: Placement;
			phase?: "response";
	  })
	| (BaseEntity<
			"TextHighlighter",
			{
				text: Bound<string>;
				highlightColor?: Bound<string>;
				required?: Bound<boolean>;
			}
	  > & {
			placement: Placement;
			phase?: "response";
	  } & Trackable)
	| (BaseEntity<
			"ContinueButton",
			{
				label?: Bound<string>;
			}
	  > & {
			placement: Placement;
			phase?: "ready";
	  });

// --- Screen behavior entities (non-visual, affect screen logic) ---

export type ScreenBehaviorEntity =
	| BaseEntity<
			"EyeTracking",
			{
				startOn: "screen-enter" | "audio-start";
				stopOn: "audio-end" | "continue-click" | "responses-complete" | "screen-exit";
				targets: "all-trackable" | { entityUids: string[] };
				hideCursor?: Bound<boolean>;
				calibrationPolicy?: "none" | "once-before-first" | "per-block";
			}
	  >
	| BaseEntity<
			"AdvanceRule",
			{
				when: "continue-click" | "audio-ended" | "responses-complete" | "timeout";
				timeoutMs?: Bound<number>;
			}
	  >
	| BaseEntity<
			"FixationGate",
			{
				durationMs: Bound<number>;
				reveal: "all-stimulus" | { entityUids: string[] };
				hideCursor?: Bound<boolean>;
			}
	  >
	| BaseEntity<
			"AudioProgress",
			{
				label?: Bound<string>;
			}
	  >
	| BaseEntity<
			"LateralCounterbalance",
			{
				columnA: string;
				columnB: string;
				leftColumn: string;
				rightColumn: string;
			}
	  >;

// --- Screen entity (composite: children + behaviors) ---

export interface ScreenEntity
	extends BaseEntity<
		"Screen",
		{
			grid: {
				type: GridType;
				subtype: GridSubtype;
			};
		}
	> {
	children: ScreenChildEntity[];
	behaviors?: ScreenBehaviorEntity[];
}

// --- Block-level step entities ---

export type StepEntity =
	| ScreenEntity
	| BaseEntity<
			"FixationStep",
			{
				durationMs: Bound<number>;
				hideCursor?: Bound<boolean>;
			}
	  >
	| BaseEntity<
			"CalibrationStep",
			{
				preset?: Bound<string>;
			}
	  >
	| BaseEntity<
			"ValidationStep",
			{
				preset?: Bound<string>;
			}
	  >
	| BaseEntity<
			"FeedbackStep",
			{
				questionSetId?: Bound<string>;
			}
	  >;

// --- Spreadsheet ---

export interface SpreadsheetColumn {
	key: string;
	label?: string;
	type?: "string" | "number" | "boolean" | "json";
}

export interface SpreadsheetRow {
	uid: string;
	blockUid: string;
	values: Record<string, string>;
	shuffleGroup?: string;
	fixed?: boolean;
	condition?: string;
}

export interface SpreadsheetDefinition {
	columns: SpreadsheetColumn[];
	rows: SpreadsheetRow[];
	shuffleMode?: "none" | "within-group";
}

export type ParticipantAssignmentMode = "random" | "url";

export interface ParticipantAssignmentConfig {
	enabled: boolean;
	mode?: ParticipantAssignmentMode;
	groups?: string[];
}

// --- Block entity ---

export interface BlockEntity
	extends BaseEntity<
		"Block",
		{
			description?: string;
		}
	> {
	steps: StepEntity[];
}

// --- Top-level experiment definition ---

export interface ExperimentDefinition {
	schemaVersion: 2;
	uid: string;
	name: string;
	description?: string;
	blocks: BlockEntity[];
	spreadsheet: SpreadsheetDefinition;
	participantAssignment?: ParticipantAssignmentConfig;
}

// --- Screen runtime (used by ScreenEntityRenderer) ---

export type ScreenPhase = "stimulus" | "response" | "ready";

export type AdvanceReason = "continue-click" | "audio-ended" | "responses-complete" | "timeout";

export interface AdvanceRequest {
	reason: AdvanceReason;
	payload?: unknown;
	at: number;
}

export interface AudioRuntimeState {
	started: boolean;
	completed: boolean;
	startedAtMs?: number;
	completedAtMs?: number;
}

export interface ScreenRuntime {
	phase: ScreenPhase;

	audioStates: Record<string, AudioRuntimeState>; // key is entity uid of AudioPlayer
	responseStates: Record<string, { completed: boolean; value?: unknown }>; // key is entity uid of RatingScale or TextHighlighter

	fixationActive: boolean;
	pendingAdvanceRequest: AdvanceRequest | null;

	markAudioStarted: (entityUid: string) => void;
	markAudioCompleted: (entityUid: string) => void;
	markResponseCompleted: (entityUid: string, value: unknown) => void;
	requestAdvance: (request: AdvanceRequest) => void;
	finalizeAdvance: () => void;
	setCompletionExtras: (extras: NonNullable<ScreenCompletionData["extras"]>) => void;
	clearFixation: () => void;

	isEntityVisible: (entityUid: string) => boolean;
	isEntityInteractive: (entityUid: string) => boolean;
}

// --- Screen completion data (output of onComplete) ---

export interface LateralCounterbalancePresentation {
	swapped: boolean;
	columnA: string;
	columnB: string;
	leftColumn: string;
	rightColumn: string;
	valueA: string;
	valueB: string;
	presentedLeft: string;
	presentedRight: string;
}

export interface ScreenCompletionData {
	screenUid: string;
	rowUid?: string; // which spreadsheet row produced this screen
	advanceReason: AdvanceReason;
	startedAt: number;
	completedAt: number;
	responses: Record<string, unknown>;
	audioTelemetry?: Record<string, AudioRuntimeState>;
	presentation?: LateralCounterbalancePresentation;
	extras?: {
		gazeData?: unknown;
		targetBoundingBoxes?: unknown;
	};
}

// ============================================================
// Legacy types (backward compatibility)
// ============================================================

// Screen-level component types (Gorilla-style behaviors attached to screens)
export type ScreenComponentType =
	| "advance-continue" // Show a continue button to advance
	| "advance-time-limit" // Auto-advance after duration
	| "advance-audio-end" // Advance when audio finishes
	| "eye-tracking" // Enable gaze tracking
	| "calibration" // Eye-tracking calibration screen
	| "fixation-cross" // Show fixation cross before content
	| "audio-rating" // MOS rating scale after audio
	| "text-highlighting"; // Text highlighting interaction

export interface ScreenComponent {
	type: ScreenComponentType;
	config?: Record<string, unknown>;
}

export interface ScreenItem {
	_id: string;
	type: ScreenItemType;
	template_type?: TemplateType;
	position: ScreenItemPosition;
	area: ItemArea;
	v_align: VAlign;
	h_align: HAlign;
	media?: IMedia;
	form?: IForm;
	text?: string;
}

export interface IScreen {
	_id: string;
	alias: string;
	description?: string;
	grid: {
		type: GridType;
		subtype: GridSubtype;
	};
	items: ScreenItem[];
	createdAt: Date | string;
	updatedAt?: Date | string;
	/** @deprecated Use components instead */
	enable_tracking?: boolean;
	/** @deprecated Use components with type "calibration" instead */
	is_calibration?: boolean;
	// Screen-level behavior components (Gorilla-style)
	components?: ScreenComponent[];
}

export const audioMockScreenTemplate: IScreen = {
	_id: "1",
	createdAt: new Date(),
	alias: "Audio Rating",
	description: "Audio playback with MOS rating scale",
	grid: {
		type: "1x1",
		subtype: "equal",
	},
	items: [
		{
			_id: "audio_template_item_1",
			type: "template",
			template_type: "audio",
			position: "center",
			area: "heading",
			v_align: "center",
			h_align: "center",
		},
	],
	enable_tracking: true,
	components: [
		{
			type: "audio-rating",
			config: {
				prompt: "Please rate the naturalness from 1 (Bad) to 5 (Excellent)",
				scale: ["1 - Bad", "2 - Poor", "3 - Fair", "4 - Good", "5 - Excellent"],
			},
		},
		{ type: "advance-continue" },
	],
};

export const twoImagesScreenTemplate: IScreen = {
	_id: "2",
	createdAt: new Date(),
	alias: "Eye Tracking (Audio + Images)",
	description: "Audio with two images and gaze tracking",
	grid: {
		type: "3x3",
		subtype: "equal",
	},
	items: [
		{
			_id: "two_images_item_left",
			type: "template",
			template_type: "image",
			position: "left",
			area: "content",
			v_align: "center",
			h_align: "center",
		},
		{
			_id: "two_images_item_right",
			type: "template",
			template_type: "image",
			position: "right",
			area: "content",
			v_align: "center",
			h_align: "center",
		},
		{
			_id: "two_images_audio_item",
			type: "template",
			template_type: "audio",
			position: "center",
			area: "heading",
			v_align: "center",
			h_align: "center",
		},
	],
	enable_tracking: true,
	components: [
		{ type: "eye-tracking" },
		{ type: "fixation-cross", config: { duration: 3000 } },
		{ type: "advance-audio-end" },
	],
};

export const blankScreenTemplate: IScreen = {
	_id: "3",
	createdAt: new Date(),
	alias: "Blank Screen",
	description: "Create a screen from scratch",
	grid: {
		type: "3x3",
		subtype: "equal",
	},
	items: [],
	enable_tracking: false,
};

export const audioTextScreenTemplate: IScreen = {
	_id: "4",
	createdAt: new Date(),
	alias: "Audio with Text Highlighting",
	description: "Audio playback with text highlighting interaction",
	grid: {
		type: "3x3",
		subtype: "equal",
	},
	items: [
		{
			_id: "audio_text_audio_item",
			type: "template",
			template_type: "audio",
			position: "center",
			area: "heading",
			v_align: "center",
			h_align: "center",
		},
		{
			_id: "audio_text_text_item",
			type: "template",
			template_type: "text",
			position: "center",
			area: "content",
			v_align: "center",
			h_align: "center",
		},
	],
	enable_tracking: true,
	components: [{ type: "text-highlighting" }, { type: "advance-continue" }],
};

export const calibrationScreenTemplate: IScreen = {
	_id: "calibration",
	createdAt: new Date(),
	alias: "Calibration",
	description: "Eye tracking calibration sequence",
	grid: {
		type: "1x1",
		subtype: "equal",
	},
	items: [],
	enable_tracking: false,
	is_calibration: true,
	components: [{ type: "calibration" }],
};

// Calibration configuration for eye tracking experiments
export type CalibrationMode = "view" | "click";

export interface CalibrationConfig {
	// Calibration points as [x, y] percentages (0-100)
	calibrationPoints: [number, number][];
	// Mode: "view" = just look at points, "click" = click on points
	calibrationMode: CalibrationMode;
	// Number of times to show each calibration point
	repetitionsPerPoint: number;
	// Whether to randomize the order of calibration points
	randomizeCalibrationOrder: boolean;
	// Time to display each calibration point (ms)
	calibrationPointDuration: number;
	// Validation points as [x, y] percentages (0-100)
	validationPoints: [number, number][];
	// Radius (in pixels) around validation point to count as "looking at"
	roiRadius: number;
	// Time allowed for eye to move to validation point (ms)
	timeToSaccade: number;
	// How long to track gaze at each validation point (ms)
	validationDuration: number;
	// Minimum percentage of gaze points that must be within ROI to pass validation (legacy)
	minimumPercentAcceptable: number;
	// Maximum number of validation points that can fail before recalibration (Gorilla-style)
	failedPointsThreshold: number;
}

export const defaultCalibrationConfig: CalibrationConfig = {
	calibrationPoints: [
		[25, 25],
		[75, 25],
		[50, 50],
		[25, 75],
		[75, 75],
	],
	calibrationMode: "view",
	repetitionsPerPoint: 1,
	randomizeCalibrationOrder: true,
	calibrationPointDuration: 2000,

	validationPoints: [
		[25, 25],
		[75, 25],
		[50, 50],
		[25, 75],
		[75, 75],
	],
	roiRadius: 200,
	timeToSaccade: 1000,
	validationDuration: 2000,
	minimumPercentAcceptable: 50,
	failedPointsThreshold: 1, // Max 1 failed point allowed (Gorilla-style validation)
};
