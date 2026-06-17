/** Keep in sync with the frontend experiment definition types. */

export type GridType = "1x1" | "2x2" | "3x3";
export type GridSubtype = "equal" | "v_centered" | "h_centered";
export type ScreenItemType = "media" | "form" | "text" | "template";
export type TemplateType = "image" | "audio" | "text";
export type ScreenItemPosition = "center" | "left" | "right";
export type ItemPosition = ScreenItemPosition;
export type ItemArea = "heading" | "content" | "footer";
export type HAlign = "center" | "left" | "right";
export type VAlign = "top" | "center" | "bottom";

export interface BindingRef<T = string> {
	kind: "binding";
	column: string;
	fallback?: T;
	required?: boolean;
}

export type Bound<T> = T | BindingRef<T>;

export interface Placement {
	area: ItemArea;
	position: ItemPosition;
	order: number;
	hAlign?: HAlign;
	vAlign?: VAlign;
}

export interface BaseEntity<K extends string, P> {
	uid: string;
	kind: K;
	name: string;
	props: P;
	enabled?: Bound<boolean>;
}

export interface Trackable {
	trackingTarget?: {
		id: string;
		label?: Bound<string>;
	};
}

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

export type ScreenBehaviorEntity =
	| BaseEntity<
			"EyeTracking",
			{
				startOn: "screen-enter" | "audio-start";
				stopOn:
					| "audio-end"
					| "continue-click"
					| "responses-complete"
					| "screen-exit";
				targets: "all-trackable" | { entityUids: string[] };
				hideCursor?: Bound<boolean>;
				calibrationPolicy?: "none" | "once-before-first" | "per-block";
			}
	  >
	| BaseEntity<
			"AdvanceRule",
			{
				when:
					| "continue-click"
					| "audio-ended"
					| "responses-complete"
					| "timeout";
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

export type ParticipantAssignmentMode = "random" | "url";

export interface ParticipantAssignmentConfig {
	enabled: boolean;
	mode?: ParticipantAssignmentMode;
	groups?: string[];
}

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

export interface BlockEntity
	extends BaseEntity<
		"Block",
		{
			description?: string;
		}
	> {
	steps: StepEntity[];
}

export interface ExperimentDefinition {
	schemaVersion: 2;
	uid: string;
	name: string;
	description?: string;
	blocks: BlockEntity[];
	spreadsheet: SpreadsheetDefinition;
	participantAssignment?: ParticipantAssignmentConfig;
}

export type ScreenPhase = "stimulus" | "response" | "ready";

export type AdvanceReason =
	| "continue-click"
	| "audio-ended"
	| "responses-complete"
	| "timeout";
