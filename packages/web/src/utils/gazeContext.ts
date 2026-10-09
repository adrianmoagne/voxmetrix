/**
 * What surrounded a gaze capture: the screen geometry the samples are relative to,
 * where the targets were, and anything that may have interrupted tracking.
 */

export const GAZE_CONTEXT_SCHEMA_VERSION = 1;

/** Screen geometry at one moment. Gaze samples and bounding boxes are in CSS pixels of this viewport. */
export interface ViewportSnapshot {
	/** `performance.now()` (ms). */
	t: number;
	innerWidth: number;
	innerHeight: number;
	/** Changes with browser zoom as well as with the monitor. */
	devicePixelRatio: number;
	screenWidth: number;
	screenHeight: number;
	scrollX: number;
	scrollY: number;
	fullscreen: boolean;
	visibility: DocumentVisibilityState;
	hasFocus: boolean;
}

export interface TargetBoundingBox {
	entityUid: string;
	boundingBox: {
		left: number;
		right: number;
		top: number;
		bottom: number;
		width: number;
		height: number;
	};
}

export type GazeContextEvent =
	| { type: "visibilitychange"; t: number; visibility: DocumentVisibilityState }
	| { type: "blur" | "focus"; t: number }
	| { type: "resize" | "fullscreenchange"; t: number; viewport: ViewportSnapshot };

export interface GazeContext {
	schemaVersion: typeof GAZE_CONTEXT_SCHEMA_VERSION;
	/** Calibration in force during the capture (see `EyeTrackingSession.calibrationIndex`). */
	calibrationIndex: number | null;
	start: ViewportSnapshot;
	end: ViewportSnapshot;
	/** Target boxes when the capture started; `extras.targetBoundingBoxes` holds them at the stop. */
	targetBoundingBoxesAtStart: TargetBoundingBox[];
	/** Tab switches, focus changes, resizes and fullscreen changes during the capture, in order. */
	events: GazeContextEvent[];
}

export const snapshotViewport = (): ViewportSnapshot => ({
	t: performance.now(),
	innerWidth: window.innerWidth,
	innerHeight: window.innerHeight,
	devicePixelRatio: window.devicePixelRatio,
	screenWidth: window.screen.width,
	screenHeight: window.screen.height,
	scrollX: window.scrollX,
	scrollY: window.scrollY,
	fullscreen: document.fullscreenElement !== null,
	visibility: document.visibilityState,
	hasFocus: document.hasFocus(),
});

export const measureTargetBoundingBoxes = (entityUids: string[]): TargetBoundingBox[] =>
	entityUids.flatMap((entityUid) => {
		const element = document.querySelector<HTMLElement>(`[data-entity-uid="${entityUid}"]`);
		if (!element) return [];

		const rect = element.getBoundingClientRect();
		return [
			{
				entityUid,
				boundingBox: {
					left: rect.left,
					right: rect.right,
					top: rect.top,
					bottom: rect.bottom,
					width: rect.width,
					height: rect.height,
				},
			},
		];
	});

/** Records a `GazeContext` from `start()` to `stop()`. Listeners are passive and do no layout work. */
export class GazeContextRecorder {
	private startSnapshot: ViewportSnapshot | null = null;
	private targetsAtStart: TargetBoundingBox[] = [];
	private events: GazeContextEvent[] = [];
	private result: GazeContext | null = null;

	constructor(
		private readonly targetEntityUids: string[],
		private readonly calibrationIndex: number | null
	) {}

	private readonly onVisibilityChange = () => {
		this.events.push({
			type: "visibilitychange",
			t: performance.now(),
			visibility: document.visibilityState,
		});
	};

	private readonly onFocusChange = (event: FocusEvent) => {
		this.events.push({ type: event.type as "blur" | "focus", t: performance.now() });
	};

	private readonly onGeometryChange = (event: Event) => {
		const viewport = snapshotViewport();
		const last = this.events[this.events.length - 1];
		// A window drag fires resize continuously; keep only the latest of an unbroken run.
		if (event.type === "resize" && last?.type === "resize") {
			this.events[this.events.length - 1] = { type: "resize", t: viewport.t, viewport };
			return;
		}
		this.events.push({
			type: event.type as "resize" | "fullscreenchange",
			t: viewport.t,
			viewport,
		});
	};

	start(): void {
		this.startSnapshot = snapshotViewport();
		this.targetsAtStart = measureTargetBoundingBoxes(this.targetEntityUids);
		document.addEventListener("visibilitychange", this.onVisibilityChange);
		document.addEventListener("fullscreenchange", this.onGeometryChange);
		window.addEventListener("blur", this.onFocusChange);
		window.addEventListener("focus", this.onFocusChange);
		window.addEventListener("resize", this.onGeometryChange, { passive: true });
	}

	/** Idempotent: later calls return the context recorded by the first. */
	stop(): GazeContext | null {
		if (this.result || !this.startSnapshot) return this.result;

		document.removeEventListener("visibilitychange", this.onVisibilityChange);
		document.removeEventListener("fullscreenchange", this.onGeometryChange);
		window.removeEventListener("blur", this.onFocusChange);
		window.removeEventListener("focus", this.onFocusChange);
		window.removeEventListener("resize", this.onGeometryChange);

		this.result = {
			schemaVersion: GAZE_CONTEXT_SCHEMA_VERSION,
			calibrationIndex: this.calibrationIndex,
			start: this.startSnapshot,
			end: snapshotViewport(),
			targetBoundingBoxesAtStart: this.targetsAtStart,
			events: this.events,
		};
		return this.result;
	}
}