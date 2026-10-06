/**
 * Frame-accurate gaze capture on top of WebGazer.
 *
 * WebGazer's own loop grabs a frame on requestAnimationFrame, runs the face model, and then
 * calls the gaze listener, so anything stamped inside the listener is late by the inference
 * time. Here the capture is driven by `requestVideoFrameCallback` instead: for every camera
 * frame we copy the pixels ourselves, keep that frame's metadata (`captureTime` when the
 * browser exposes it, otherwise `presentationTime`), run the prediction on those exact pixels,
 * and map the frame time onto the audio *output* clock through `getOutputTimestamp()` anchors.
 *
 * Pixels are copied through `new VideoFrame(video)`, whose `timestamp` equals the callback's
 * `mediaTime` for the same frame, so every copy is tied to its metadata by media timestamp
 * rather than by when it happened. Inference is slower than the camera: frames arriving while
 * the model is busy are logged as skipped, and when inference finishes the newest frame is
 * analyzed right away ("catch-up") and matched to its callback afterwards if needed.
 *
 * `finish()` keeps capturing until a frame newer than the moment the audio stopped being heard
 * arrives, so the end of a clip is not lost to output latency, camera latency and inference.
 *
 * The anchor mapping assumes the audio clock ran in step with `performance.now()` between the
 * frame and its anchor. When the context is suspended the audio clock freezes while frames keep
 * coming, so frames around a suspension, or mapped through a stale output reading, get no
 * `audioTime` and say why in `audioClock`. The browser reports a suspension a little after it
 * happens; samples recorded in that gap are corrected when the report arrives.
 *
 * Everything needed to redo the mapping offline is kept: frame ids, media and clock times,
 * grab/done times, skipped frames, clock anchors, and the playback segments of every audio.
 */
import {
	contextTimeAtPerformanceTime,
	describeAudioContext,
	sampleAudioClockAnchor,
	type AudioClockAnchor,
	type AudioContextInfo,
	type AudioPositionAtTime,
	type AudioTrackTimeline,
	type WebAudioTrack,
} from "./webAudioPlayback";

export const GAZE_CAPTURE_SCHEMA_VERSION = 3;

export interface ActiveAudio {
	uid: string;
	track: WebAudioTrack;
}

export type GazeCaptureMethod = "rvfc" | "webgazer-loop";
/**
 * Why the legacy loop was used:
 * - `rvfc_unsupported`: the browser has no `requestVideoFrameCallback`.
 * - `no_frame_callbacks`: it exists but never fired after the capture started.
 */
export type GazeCaptureFallback = "rvfc_unsupported" | "no_frame_callbacks";
/**
 * How pixels are copied in rVFC mode:
 * - `videoframe`: through `VideoFrame`, so each copy carries its media timestamp.
 * - `drawimage`: straight from the element (no WebCodecs); a copy is assumed to hold the
 *   latest reported frame, which can be one frame off for catch-ups.
 */
export type GazeFrameSnapshot = "videoframe" | "drawimage";
export type GazeSampleStatus = "ok" | "no_face" | "error";
/**
 * Which clock reading `t` comes from:
 * - `captureTime`: camera-reported capture time of the exact frame (rVFC).
 * - `presentationTime`: when the browser handed that frame to the compositor (rVFC).
 * - `loopGrab`: WebGazer's own grab time (`begin` time + elapsed), legacy loop mode.
 * - `listener`: time the prediction arrived; only when nothing better exists.
 */
export type GazeFrameTimeSource = "captureTime" | "presentationTime" | "loopGrab" | "listener";
/**
 * How the analyzed pixels were tied to a camera frame:
 * - `exact`: copied inside that frame's own callback.
 * - `catchup`: copied between callbacks, when inference finished and a newer frame was waiting.
 * - `estimated`: copied between callbacks, but the browser never reported that frame in a
 *   callback, so `t` is extrapolated from the next frame by media timestamps and `frameId` is null.
 * - `unknown`: legacy loop mode (no frame identity available).
 */
export type GazeFrameIdentity = "exact" | "catchup" | "estimated" | "unknown";
/**
 * Why a frame that falls inside a clip's playing range got no `audioTime`:
 * - `suspended`: the audio context was not running at the frame, or changed state between the
 *   frame and its clock reading.
 * - `stale`: the output clock reading was too old to extrapolate from (output stalled).
 */
export type GazeAudioClockIssue = "suspended" | "stale";

/** An audio context state as the page learned it; the change itself can be slightly earlier. */
export interface AudioContextStateChange {
	/** `performance.now()` when the page was told. */
	performanceTime: number;
	/** `currentTime` at that moment; for a suspension, where the audio clock froze. */
	contextTime: number;
	state: AudioContextState;
}

export interface GazeSample {
	/** Raw regression output in CSS pixels; null when no face was found or inference failed. */
	x: number | null;
	y: number | null;
	/** Frame time on the `performance.now()` clock (ms). */
	t: number;
	tSource: GazeFrameTimeSource;
	/** `presentedFrames` counter of the source frame; null in legacy loop mode. */
	frameId: number | null;
	frameIdentity: GazeFrameIdentity;
	/** Media timestamp of the source frame (µs), shared by `VideoFrame` and rVFC `mediaTime`. */
	mediaTimeUs?: number;
	captureTime?: number;
	presentationTime?: number;
	expectedDisplayTime?: number;
	/** When the pixels were read for inference (ms). */
	tGrab: number;
	/** When the prediction became available (ms). */
	tDone: number;
	status: GazeSampleStatus;
	/** Index in `GazeCaptureMeta.audioAnchors` of the clock pairing taken at `tGrab`. */
	anchorIndex?: number;
	audioUid?: string;
	audioSegment?: number;
	/** Clip position (s) that was leaving the output device at `t`. */
	audioTime?: number;
	/** Set instead of `audioTime` when the audio clock could not be trusted for this frame. */
	audioClock?: GazeAudioClockIssue;
	/** Clip position by the previous method (player clock read at `tDone`), for comparison. */
	audioTimeLegacy?: number;
}

/**
 * - `busy`: arrived while inference was running and was never analyzed.
 * - `no_canvas`: WebGazer's video canvas was not ready.
 */
export type SkippedFrameReason = "busy" | "no_canvas";

export interface SkippedFrame {
	frameId: number;
	mediaTimeUs: number;
	presentationTime: number;
	captureTime: number | null;
	reason: SkippedFrameReason;
}

/**
 * How `finish()` ended:
 * - `complete`: a frame newer than `drainUntil` arrived and no inference was left in flight.
 * - `timeout`: frames stopped arriving; anything still in flight was dropped.
 * - `interrupted`: the capture was stopped outright before the drain completed.
 */
export type GazeDrainOutcome = "complete" | "timeout" | "interrupted";

export interface GazeCaptureMeta {
	schemaVersion: typeof GAZE_CAPTURE_SCHEMA_VERSION;
	method: GazeCaptureMethod;
	fallback: GazeCaptureFallback | null;
	/** Null in legacy loop mode. */
	frameSnapshot: GazeFrameSnapshot | null;
	/** Best frame-time source observed during this capture. */
	frameTimeSource: GazeFrameTimeSource;
	/** Predictions are stored unfiltered (WebGazer's Kalman filter is off while capturing). */
	gazeFilter: "none";
	startedAt: number;
	/** When `finish()` was called; null when the capture was stopped outright. */
	stopRequestedAt: number | null;
	/** Frames up to this time (the later of the stop request and the audio's audible end) were awaited. */
	drainUntil: number | null;
	drainOutcome: GazeDrainOutcome | null;
	stoppedAt: number;
	video: { width: number; height: number } | null;
	frameCallbacks: number;
	processedFrames: number;
	/** Copies taken between callbacks, `estimated` ones included. */
	catchUpFrames: number;
	estimatedFrames: number;
	/** Copies whose media timestamp could not be read (`drawimage` snapshot). */
	unverifiedFrames: number;
	noFaceFrames: number;
	errorFrames: number;
	skippedFrames: SkippedFrame[];
	/** Output-clock anchors, one per analyzed frame with audio in scope (see `anchorIndex`). */
	audioAnchors: AudioClockAnchor[];
	audioTimelines: Record<string, AudioTrackTimeline>;
	audioContext: AudioContextInfo | null;
	/** State of the audio context when first seen, then every change during the capture. */
	audioContextStates: AudioContextStateChange[];
}

export interface GazeCaptureResult {
	samples: GazeSample[];
	capture: GazeCaptureMeta;
}

export interface GazeCaptureOptions {
	webgazer: WebGazer;
	video: HTMLVideoElement | null;
	getActiveAudio: () => ActiveAudio | null;
	/** `performance.now()` origin of WebGazer's `elapsedMs`; enables `loopGrab` timing in legacy mode. */
	beginTime: number | null;
}

export const supportsVideoFrameCallback = (
	video: HTMLVideoElement | null
): video is HTMLVideoElement => !!video && typeof video.requestVideoFrameCallback === "function";

const supportsVideoFrameSnapshot = (): boolean => typeof VideoFrame === "function";

export const emptyCaptureResult = (): GazeCaptureResult => {
	const now = performance.now();
	return {
		samples: [],
		capture: {
			schemaVersion: GAZE_CAPTURE_SCHEMA_VERSION,
			method: "webgazer-loop",
			fallback: null,
			frameSnapshot: null,
			frameTimeSource: "listener",
			gazeFilter: "none",
			startedAt: now,
			stopRequestedAt: null,
			drainUntil: null,
			drainOutcome: null,
			stoppedAt: now,
			video: null,
			frameCallbacks: 0,
			processedFrames: 0,
			catchUpFrames: 0,
			estimatedFrames: 0,
			unverifiedFrames: 0,
			noFaceFrames: 0,
			errorFrames: 0,
			skippedFrames: [],
			audioAnchors: [],
			audioTimelines: {},
			audioContext: null,
			audioContextStates: [],
		},
	};
};

/** Longest camera pipeline delay we accept before treating `captureTime` as unreliable. */
const MAX_CAPTURE_TO_PRESENTATION_MS = 1000;
/** Time without any frame callback after which rVFC is treated as broken and the loop is used. */
const FRAME_CALLBACK_WATCHDOG_MS = 1500;
/** Extra wait past `drainUntil` before giving up on frames that never arrive. */
const DRAIN_TIMEOUT_MS = 1000;
/** Reported frames kept for matching copies by media timestamp. */
const RECENT_FRAMES = 32;
/**
 * Oldest output clock reading still extrapolated from. Readings are normally at most one audio
 * callback old (about 11 ms); a much older one means the output stopped advancing. Callbacks
 * can be as long as `baseLatency` (large buffers), so the limit grows to twice that.
 */
const MAX_ANCHOR_AGE_MS = 100;

const maxAnchorAgeMs = (context: AudioContext): number =>
	typeof context.baseLatency === "number"
		? Math.max(MAX_ANCHOR_AGE_MS, 2 * context.baseLatency * 1000)
		: MAX_ANCHOR_AGE_MS;
/** Recorded samples kept for correction when a suspension is reported late (about 3 s). */
const RECENT_SAMPLES = 90;

/**
 * `captureTime` is driver-reported. Keep it only when it sits on the same clock as
 * `presentationTime` and precedes it by a believable amount.
 */
const plausibleCaptureTime = (metadata: VideoFrameCallbackMetadata): number | null => {
	const { captureTime, presentationTime } = metadata;
	if (typeof captureTime !== "number" || !Number.isFinite(captureTime)) return null;
	const delay = presentationTime - captureTime;
	if (delay < 0 || delay > MAX_CAPTURE_TO_PRESENTATION_MS) return null;
	return captureTime;
};

/** Milliseconds to 0.1 ms; the clocks involved are not more precise than that. */
const roundMs = (value: number): number => Math.round(value * 10) / 10;
/** Seconds to 0.1 ms. */
const roundSec = (value: number): number => Math.round(value * 10000) / 10000;
/** `mediaTime` (s, double) and `VideoFrame.timestamp` (µs, integer) can differ by rounding. */
const sameMediaTime = (a: number, b: number): boolean => Math.abs(a - b) <= 1;

interface FrameInfo {
	frameId: number;
	mediaTimeUs: number;
	presentationTime: number;
	expectedDisplayTime: number;
	captureTime: number | null;
}

const frameInfoFromMetadata = (metadata: VideoFrameCallbackMetadata): FrameInfo => {
	const captureTime = plausibleCaptureTime(metadata);
	return {
		frameId: metadata.presentedFrames,
		mediaTimeUs: Math.round(metadata.mediaTime * 1e6),
		presentationTime: roundMs(metadata.presentationTime),
		expectedDisplayTime: roundMs(metadata.expectedDisplayTime),
		captureTime: captureTime === null ? null : roundMs(captureTime),
	};
};

const frameInfoTime = (frame: FrameInfo): number => frame.captureTime ?? frame.presentationTime;
const frameInfoTimeSource = (frame: FrameInfo): GazeFrameTimeSource =>
	frame.captureTime !== null ? "captureTime" : "presentationTime";

interface FrameTime {
	t: number;
	tSource: GazeFrameTimeSource;
}

/** Time of an unreported frame, from a reported one and the media timestamp difference. */
const estimateFrameTime = (reference: FrameInfo, mediaTimeUs: number): FrameTime => ({
	t: frameInfoTime(reference) + (mediaTimeUs - reference.mediaTimeUs) / 1000,
	tSource: frameInfoTimeSource(reference),
});

/** A frame whose pixels were copied and whose prediction is (or was) in flight. */
interface PendingFrame {
	frame: FrameInfo | null;
	/** Media timestamp of the copied pixels; null in legacy loop mode. */
	mediaTimeUs: number | null;
	/** Set for frames no callback ever reported. */
	estimate: FrameTime | null;
	frameIdentity: GazeFrameIdentity;
	/** Grab time in legacy mode, where no frame metadata exists. */
	loopGrabTime: number | null;
	loopTimeSource: GazeFrameTimeSource;
	tGrab: number;
	anchor: AudioClockAnchor | null;
	anchorIndex: number | null;
	activeAudio: ActiveAudio | null;
	/** Set once the prediction arrived and the sample was stored. */
	sample: GazeSample | null;
}

const frameTime = (pending: PendingFrame): FrameTime => {
	if (pending.frame) {
		return { t: frameInfoTime(pending.frame), tSource: frameInfoTimeSource(pending.frame) };
	}
	if (pending.estimate) return pending.estimate;
	return { t: pending.loopGrabTime ?? pending.tGrab, tSource: pending.loopTimeSource };
};

const stateChangeOf = (context: AudioContext): AudioContextStateChange => ({
	performanceTime: performance.now(),
	contextTime: context.currentTime,
	state: context.state,
});

interface DrainState {
	requestedAt: number;
	until: number;
	/** A frame newer than `until` has arrived. */
	reached: boolean;
	outcome: GazeDrainOutcome | null;
	timer: ReturnType<typeof setTimeout>;
	promise: Promise<GazeCaptureResult>;
	resolve: (result: GazeCaptureResult) => void;
}

export class FrameDrivenGazeCapture {
	private readonly webgazer: WebGazer;
	private readonly video: HTMLVideoElement | null;
	private readonly getActiveAudio: () => ActiveAudio | null;
	private readonly beginTime: number | null;
	private readonly frameSnapshot: GazeFrameSnapshot;

	private method: GazeCaptureMethod;
	private fallback: GazeCaptureFallback | null;
	private samples: GazeSample[] = [];
	private skipped: SkippedFrame[] = [];
	private anchors: AudioClockAnchor[] = [];
	private seenTracks = new Map<string, WebAudioTrack>();
	private frameCallbacks = 0;
	private catchUpFrames = 0;
	private estimatedFrames = 0;
	private unverifiedFrames = 0;
	private noFaceFrames = 0;
	private errorFrames = 0;
	private frameTimeSource: GazeFrameTimeSource;
	private startedAt = 0;
	private running = false;
	private busy = false;
	private frameCallbackHandle: number | null = null;
	private watchdog: ReturnType<typeof setTimeout> | null = null;
	private previousKalman: boolean | null = null;
	/** Newest frame reported by rVFC, processed or not. */
	private latestFrame: FrameInfo | null = null;
	/** Recently reported frames by `mediaTimeUs`, oldest first. */
	private recentFrames = new Map<number, FrameInfo>();
	/** Copies of frames not reported yet, by `mediaTimeUs`. */
	private awaiting = new Map<number, PendingFrame>();
	private lastProcessedMediaTimeUs: number | null = null;
	private drain: DrainState | null = null;
	private result: GazeCaptureResult | null = null;
	private contextStates = new Map<AudioContext, AudioContextStateChange[]>();
	private contextListeners = new Map<AudioContext, () => void>();
	/** Latest recorded frames, oldest first, for correction after a late suspension report. */
	private recentPendings: PendingFrame[] = [];

	constructor(options: GazeCaptureOptions) {
		this.webgazer = options.webgazer;
		this.video = options.video;
		this.getActiveAudio = options.getActiveAudio;
		this.beginTime = options.beginTime;
		const rvfc = supportsVideoFrameCallback(this.video);
		this.method = rvfc ? "rvfc" : "webgazer-loop";
		this.fallback = rvfc ? null : "rvfc_unsupported";
		this.frameSnapshot = supportsVideoFrameSnapshot() ? "videoframe" : "drawimage";
		this.frameTimeSource = rvfc ? "presentationTime" : this.loopTimeSource();
	}

	get isRunning(): boolean {
		return this.running;
	}

	start(): void {
		if (this.running || this.result) return;
		this.running = true;
		this.startedAt = performance.now();

		this.previousKalman = this.webgazer.params.applyKalmanFilter;
		this.webgazer.applyKalmanFilter(false);

		if (this.method === "rvfc") {
			// Our callback owns frame grabbing and inference; WebGazer's rAF loop must stay idle.
			this.webgazer.pause();
			this.webgazer.clearGazeListener();
			this.scheduleFrameCallback();
			this.watchdog = setTimeout(this.handleWatchdog, FRAME_CALLBACK_WATCHDOG_MS);
			return;
		}

		this.startLoop();
	}

	/**
	 * Stop once every frame up to the later of now and the moment the audio stopped being heard
	 * has been analyzed. Resolves early with whatever was collected if `stop()` is called first.
	 */
	finish(): Promise<GazeCaptureResult> {
		if (this.result) return Promise.resolve(this.result);
		if (this.drain) return this.drain.promise;
		if (!this.running) return Promise.resolve(this.stop());

		const requestedAt = performance.now();
		const until = Math.max(requestedAt, this.audibleUntil() ?? requestedAt);
		let resolve!: (result: GazeCaptureResult) => void;
		const promise = new Promise<GazeCaptureResult>((settle) => {
			resolve = settle;
		});
		const timer = setTimeout(
			() => this.completeDrain("timeout"),
			until - requestedAt + DRAIN_TIMEOUT_MS
		);
		this.drain = { requestedAt, until, reached: false, outcome: null, timer, promise, resolve };
		return promise;
	}

	/** Stop immediately; a prediction still in flight is dropped. */
	stop(): GazeCaptureResult {
		if (this.result) return this.result;
		this.running = false;
		const stoppedAt = performance.now();

		if (this.watchdog !== null) {
			clearTimeout(this.watchdog);
			this.watchdog = null;
		}
		this.cancelFrameCallback();
		for (const [context, listener] of this.contextListeners) {
			context.removeEventListener("statechange", listener);
		}
		this.contextListeners.clear();
		this.webgazer.clearGazeListener();
		this.webgazer.pause();
		if (this.previousKalman !== null) {
			this.webgazer.applyKalmanFilter(this.previousKalman);
			this.previousKalman = null;
		}

		const drain = this.drain;
		if (drain) {
			clearTimeout(drain.timer);
			drain.outcome ??= "interrupted";
		}

		// Copies still waiting for their callback get a time from the newest frame we know.
		if (this.latestFrame) {
			for (const [mediaTimeUs, pending] of this.awaiting) {
				this.markEstimated(pending, this.latestFrame, mediaTimeUs);
			}
		}
		this.awaiting.clear();

		const audioTimelines: Record<string, AudioTrackTimeline> = {};
		let audioContext: AudioContextInfo | null = null;
		let audioContextStates: AudioContextStateChange[] | null = null;
		for (const [uid, track] of this.seenTracks) {
			audioTimelines[uid] = track.getTimeline();
			audioContext ??= describeAudioContext(track.audioContext);
			audioContextStates ??= this.contextStates.get(track.audioContext) ?? null;
		}

		const canvas = this.webgazer.getVideoElementCanvas();
		const result: GazeCaptureResult = {
			samples: this.samples,
			capture: {
				schemaVersion: GAZE_CAPTURE_SCHEMA_VERSION,
				method: this.method,
				fallback: this.fallback,
				frameSnapshot: this.method === "rvfc" ? this.frameSnapshot : null,
				frameTimeSource: this.frameTimeSource,
				gazeFilter: "none",
				startedAt: roundMs(this.startedAt),
				stopRequestedAt: drain ? roundMs(drain.requestedAt) : null,
				drainUntil: drain ? roundMs(drain.until) : null,
				drainOutcome: drain?.outcome ?? null,
				stoppedAt: roundMs(stoppedAt),
				video: canvas && canvas.width > 0 ? { width: canvas.width, height: canvas.height } : null,
				frameCallbacks: this.frameCallbacks,
				processedFrames: this.samples.length,
				catchUpFrames: this.catchUpFrames,
				estimatedFrames: this.estimatedFrames,
				unverifiedFrames: this.unverifiedFrames,
				noFaceFrames: this.noFaceFrames,
				errorFrames: this.errorFrames,
				skippedFrames: this.skipped,
				audioAnchors: this.anchors,
				audioTimelines,
				audioContext,
				audioContextStates: audioContextStates ?? [],
			},
		};

		this.result = result;
		this.latestFrame = null;
		this.recentFrames.clear();
		this.recentPendings = [];
		drain?.resolve(result);
		return result;
	}

	/** Latest moment any audio of this capture is still heard, on the `performance.now()` clock. */
	private audibleUntil(): number | null {
		const tracks = new Map(this.seenTracks);
		const active = this.getActiveAudio();
		if (active) tracks.set(active.uid, active.track);

		let latest: number | null = null;
		for (const track of tracks.values()) {
			const end = track.audibleUntil();
			if (end !== null && (latest === null || end > latest)) latest = end;
		}
		return latest;
	}

	private completeDrain(outcome: GazeDrainOutcome): void {
		if (!this.drain || this.drain.outcome) return;
		this.drain.outcome = outcome;
		this.stop();
	}

	private maybeCompleteDrain(): void {
		if (this.drain?.reached && !this.busy) this.completeDrain("complete");
	}

	// ----------------------------------------------------------------- rVFC-driven capture

	private scheduleFrameCallback(): void {
		if (!this.running || !this.video || this.method !== "rvfc") return;
		this.frameCallbackHandle = this.video.requestVideoFrameCallback(this.handleVideoFrame);
	}

	private cancelFrameCallback(): void {
		if (this.frameCallbackHandle !== null && this.video) {
			this.video.cancelVideoFrameCallback(this.frameCallbackHandle);
		}
		this.frameCallbackHandle = null;
	}

	private handleWatchdog = (): void => {
		this.watchdog = null;
		if (!this.running || this.method !== "rvfc" || this.frameCallbacks > 0) return;

		this.cancelFrameCallback();
		this.method = "webgazer-loop";
		this.fallback = "no_frame_callbacks";
		this.frameTimeSource = this.loopTimeSource();
		this.startLoop();
	};

	private handleVideoFrame = (_now: number, metadata: VideoFrameCallbackMetadata): void => {
		if (!this.running || this.method !== "rvfc") return;
		this.scheduleFrameCallback();
		this.frameCallbacks++;

		const frame = frameInfoFromMetadata(metadata);
		this.latestFrame = frame;
		this.rememberFrame(frame);
		if (frame.captureTime !== null) {
			this.frameTimeSource = "captureTime";
		}

		const alreadyAnalyzed = this.resolveAwaiting(frame);

		if (this.drain && frameInfoTime(frame) > this.drain.until) {
			this.drain.reached = true;
			this.maybeCompleteDrain();
			return;
		}

		if (alreadyAnalyzed || this.isLastProcessed(frame.mediaTimeUs)) return;

		if (this.busy) {
			this.skipped.push({
				frameId: frame.frameId,
				mediaTimeUs: frame.mediaTimeUs,
				presentationTime: frame.presentationTime,
				captureTime: frame.captureTime,
				reason: "busy",
			});
			return;
		}

		this.processFrame(frame);
	};

	private rememberFrame(frame: FrameInfo): void {
		this.recentFrames.set(frame.mediaTimeUs, frame);
		if (this.recentFrames.size > RECENT_FRAMES) {
			const oldest = this.recentFrames.keys().next().value;
			if (oldest !== undefined) this.recentFrames.delete(oldest);
		}
	}

	private findRecentFrame(mediaTimeUs: number): FrameInfo | null {
		for (const frame of this.recentFrames.values()) {
			if (sameMediaTime(frame.mediaTimeUs, mediaTimeUs)) return frame;
		}
		return null;
	}

	private isLastProcessed(mediaTimeUs: number): boolean {
		return (
			this.lastProcessedMediaTimeUs !== null &&
			sameMediaTime(this.lastProcessedMediaTimeUs, mediaTimeUs)
		);
	}

	/**
	 * Attach `frame`'s metadata to a copy that was waiting for it. A copy older than `frame`
	 * whose callback never came is resolved by estimation. Returns true when `frame` itself
	 * had already been copied.
	 */
	private resolveAwaiting(frame: FrameInfo): boolean {
		let matched = false;
		for (const [mediaTimeUs, pending] of this.awaiting) {
			if (sameMediaTime(mediaTimeUs, frame.mediaTimeUs)) {
				pending.frame = frame;
				matched = true;
				if (pending.sample) this.applyFrame(pending.sample, pending);
			} else if (mediaTimeUs < frame.mediaTimeUs) {
				this.markEstimated(pending, frame, mediaTimeUs);
			} else {
				continue;
			}
			this.awaiting.delete(mediaTimeUs);
		}
		return matched;
	}

	private markEstimated(pending: PendingFrame, reference: FrameInfo, mediaTimeUs: number): void {
		pending.estimate = estimateFrameTime(reference, mediaTimeUs);
		pending.frameIdentity = "estimated";
		this.estimatedFrames++;
		if (pending.sample) this.applyFrame(pending.sample, pending);
	}

	/** Drop a frame from the skipped log once a catch-up analyzed it after all. */
	private unskip(frameId: number): void {
		for (let i = this.skipped.length - 1; i >= 0; i--) {
			const entry = this.skipped[i];
			if (entry.frameId === frameId && entry.reason === "busy") {
				this.skipped.splice(i, 1);
				return;
			}
		}
	}

	private snapshotVideo(): VideoFrame | null {
		if (this.frameSnapshot !== "videoframe" || !this.video) return null;
		try {
			return new VideoFrame(this.video);
		} catch {
			return null;
		}
	}

	/**
	 * Copy the video's current frame into WebGazer's canvas and start inference on it.
	 * `callbackFrame` is the frame whose callback is running, or null for a catch-up.
	 * Returns false when nothing new was copied.
	 */
	private processFrame(callbackFrame: FrameInfo | null): boolean {
		const canvas = this.webgazer.getVideoElementCanvas();
		const context = canvas && canvas.width > 0 ? canvas.getContext("2d") : null;
		if (!canvas || !context || !this.video) {
			if (callbackFrame) {
				this.skipped.push({
					frameId: callbackFrame.frameId,
					mediaTimeUs: callbackFrame.mediaTimeUs,
					presentationTime: callbackFrame.presentationTime,
					captureTime: callbackFrame.captureTime,
					reason: "no_canvas",
				});
			}
			return false;
		}

		const snapshot = this.snapshotVideo();
		let mediaTimeUs: number;
		let frame: FrameInfo | null;
		if (snapshot) {
			mediaTimeUs = snapshot.timestamp;
			if (this.isLastProcessed(mediaTimeUs)) {
				snapshot.close();
				return false;
			}
			frame = this.findRecentFrame(mediaTimeUs);
		} else {
			frame = callbackFrame ?? this.latestFrame;
			if (!frame || (!callbackFrame && this.isLastProcessed(frame.mediaTimeUs))) return false;
			mediaTimeUs = frame.mediaTimeUs;
			this.unverifiedFrames++;
		}

		// The tracker is patched to read from this canvas, so the pixels it sees are exactly
		// the copied frame, regardless of when inference actually runs.
		try {
			context.drawImage(snapshot ?? this.video, 0, 0, canvas.width, canvas.height);
		} finally {
			snapshot?.close();
		}
		const tGrab = performance.now();
		this.lastProcessedMediaTimeUs = mediaTimeUs;

		const identity: GazeFrameIdentity =
			frame !== null && frame === callbackFrame ? "exact" : "catchup";
		if (identity === "catchup") this.catchUpFrames++;
		if (frame) this.unskip(frame.frameId);

		const activeAudio = this.getActiveAudio();
		const pending: PendingFrame = {
			frame,
			mediaTimeUs,
			estimate: null,
			frameIdentity: identity,
			loopGrabTime: null,
			loopTimeSource: "listener",
			tGrab,
			...this.sampleAnchor(activeAudio),
			activeAudio,
			sample: null,
		};
		if (!frame) this.awaiting.set(mediaTimeUs, pending);

		this.busy = true;
		this.webgazer
			.getCurrentPrediction()
			.then(
				(prediction) => this.record(pending, prediction, "ok"),
				() => this.record(pending, null, "error")
			)
			.finally(() => {
				this.busy = false;
				if (this.drain?.reached) {
					this.maybeCompleteDrain();
				} else {
					this.maybeCatchUp();
				}
			});
		return true;
	}

	/** Analyze the video's current frame right away if it is newer than the last one analyzed. */
	private maybeCatchUp(): void {
		if (!this.running || this.busy) return;
		this.processFrame(null);
	}

	// ----------------------------------------------------------------- legacy loop fallback

	private loopTimeSource(): GazeFrameTimeSource {
		return this.beginTime !== null ? "loopGrab" : "listener";
	}

	private startLoop(): void {
		this.webgazer.setGazeListener(this.handleLoopPrediction);
		void this.webgazer.resume();
	}

	private handleLoopPrediction = (
		prediction: { x: number; y: number } | null,
		elapsedMs: number
	): void => {
		if (!this.running) return;
		this.frameCallbacks++;
		const tDone = performance.now();
		const hasGrabTime = this.beginTime !== null && Number.isFinite(elapsedMs);
		const tGrab = hasGrabTime ? (this.beginTime as number) + elapsedMs : tDone;

		if (this.drain && tGrab > this.drain.until) {
			this.drain.reached = true;
			this.completeDrain("complete");
			return;
		}

		const activeAudio = this.getActiveAudio();
		const pending: PendingFrame = {
			frame: null,
			mediaTimeUs: null,
			estimate: null,
			frameIdentity: "unknown",
			loopGrabTime: tGrab,
			loopTimeSource: hasGrabTime ? "loopGrab" : "listener",
			tGrab,
			...this.sampleAnchor(activeAudio),
			activeAudio,
			sample: null,
		};
		this.record(pending, prediction, "ok", tDone);
	};

	// ----------------------------------------------------------------- shared

	private sampleAnchor(
		activeAudio: ActiveAudio | null
	): Pick<PendingFrame, "anchor" | "anchorIndex"> {
		if (activeAudio) this.seenTracks.set(activeAudio.uid, activeAudio.track);
		const track = activeAudio?.track ?? this.seenTracks.values().next().value;
		if (!track) return { anchor: null, anchorIndex: null };
		this.watchContext(track.audioContext);
		const anchor = sampleAudioClockAnchor(track.audioContext);
		this.anchors.push(anchor);
		return { anchor, anchorIndex: this.anchors.length - 1 };
	}

	private watchContext(context: AudioContext): void {
		if (this.contextStates.has(context)) return;
		this.contextStates.set(context, [stateChangeOf(context)]);
		const listener = () => this.handleContextStateChange(context);
		context.addEventListener("statechange", listener);
		this.contextListeners.set(context, listener);
	}

	private handleContextStateChange(context: AudioContext): void {
		const log = this.contextStates.get(context);
		if (!this.running || !log) return;
		const change = stateChangeOf(context);
		log.push(change);
		if (change.state === "running") return;

		// Samples mapped before the page learned of the suspension may lie past the frozen clock.
		for (const pending of this.recentPendings) {
			if (pending.sample && pending.anchor && pending.anchor.sampledAt < change.performanceTime) {
				this.applyFrame(pending.sample, pending);
			}
		}
	}

	/**
	 * Whether `anchor` may map the frame at `t`. The mapping holds only if the audio clock ran
	 * in step with `performance.now()` from the frame to the anchor.
	 */
	private audioClockIssue(
		anchor: AudioClockAnchor,
		t: number,
		context: AudioContext
	): GazeAudioClockIssue | null {
		if (anchor.contextState !== "running") return "suspended";

		const log = this.contextStates.get(context) ?? [];
		const from = Math.min(t, anchor.sampledAt);
		const to = Math.max(t, anchor.sampledAt);
		let stateAtFrame: AudioContextState = anchor.contextState;
		for (let i = 0; i < log.length; i++) {
			const entry = log[i];
			const changed = i > 0 && entry.state !== log[i - 1].state;
			if (changed && entry.performanceTime > from && entry.performanceTime <= to) {
				return "suspended";
			}
			if (entry.performanceTime <= t) stateAtFrame = entry.state;
			// Reported after the anchor was read, but rendering had already frozen at
			// `entry.contextTime` when it was: the render clock only reaches that value once
			// frozen, and an output reading taken then no longer follows real time.
			if (
				entry.state !== "running" &&
				entry.performanceTime > anchor.sampledAt &&
				anchor.renderContextTime >= entry.contextTime
			) {
				return "suspended";
			}
		}
		if (stateAtFrame !== "running") return "suspended";

		if (
			anchor.source === "outputTimestamp" &&
			anchor.sampledAt - anchor.performanceTime > maxAnchorAgeMs(context)
		) {
			return "stale";
		}
		return null;
	}

	private record(
		pending: PendingFrame,
		prediction: { x: number; y: number } | null,
		status: GazeSampleStatus,
		tDone = performance.now()
	): void {
		if (!this.running) return;

		const point =
			status === "ok" &&
			prediction &&
			Number.isFinite(prediction.x) &&
			Number.isFinite(prediction.y)
				? prediction
				: null;
		const finalStatus: GazeSampleStatus = status === "error" ? "error" : point ? "ok" : "no_face";
		if (finalStatus === "no_face") this.noFaceFrames++;
		if (finalStatus === "error") this.errorFrames++;

		const sample: GazeSample = {
			x: point ? point.x : null,
			y: point ? point.y : null,
			t: 0,
			tSource: "listener",
			frameId: null,
			frameIdentity: pending.frameIdentity,
			tGrab: roundMs(pending.tGrab),
			tDone: roundMs(tDone),
			status: finalStatus,
		};
		if (pending.anchorIndex !== null) {
			sample.anchorIndex = pending.anchorIndex;
		}
		if (pending.activeAudio) {
			const legacy = pending.activeAudio.track.getPlaybackTime();
			if (legacy !== null) sample.audioTimeLegacy = roundSec(legacy);
		}

		this.applyFrame(sample, pending);
		pending.sample = sample;
		this.samples.push(sample);
		this.recentPendings.push(pending);
		if (this.recentPendings.length > RECENT_SAMPLES) this.recentPendings.shift();
	}

	/** (Re)derive the frame-dependent fields of a sample: times, identity and audio position. */
	private applyFrame(sample: GazeSample, pending: PendingFrame): void {
		const { t, tSource } = frameTime(pending);
		sample.t = roundMs(t);
		sample.tSource = tSource;
		sample.frameIdentity = pending.frameIdentity;
		sample.frameId = pending.frame?.frameId ?? null;
		sample.mediaTimeUs = pending.mediaTimeUs ?? undefined;
		sample.captureTime = pending.frame?.captureTime ?? undefined;
		sample.presentationTime = pending.frame?.presentationTime;
		sample.expectedDisplayTime = pending.frame?.expectedDisplayTime;

		delete sample.audioUid;
		delete sample.audioSegment;
		delete sample.audioTime;
		delete sample.audioClock;
		if (!pending.anchor) return;

		// The registered player is not necessarily the one heard: a clip's audible tail outlasts
		// its `onended`, after which the next clip may register, and replaying a clip does not
		// register it again. So every track heard in this capture is a candidate; among those
		// playing at the frame, prefer the registered one, then the one that started last.
		const contextTime = contextTimeAtPerformanceTime(pending.anchor, t);
		const activeUid = pending.activeAudio?.uid;
		let best: { uid: string; track: WebAudioTrack; position: AudioPositionAtTime } | null = null;
		for (const [uid, track] of this.seenTracks) {
			const position = track.positionAtContextTime(contextTime);
			if (!position) continue;
			if (
				!best ||
				(best.uid !== activeUid &&
					(uid === activeUid || position.startContextTime > best.position.startContextTime))
			) {
				best = { uid, track, position };
			}
		}
		if (!best) return;

		const issue = this.audioClockIssue(pending.anchor, t, best.track.audioContext);
		if (issue) {
			sample.audioClock = issue;
			return;
		}
		sample.audioUid = best.uid;
		sample.audioSegment = best.position.segmentId;
		sample.audioTime = roundSec(best.position.positionSec);
	}
}

/**
 * Make WebGazer's face model read the frame we copied into its video canvas instead of the
 * live `<video>` element, so the pixels it analyzes are the frame whose metadata we stored.
 * Idempotent; also harmless for WebGazer's own loop, which draws the same frame first.
 */
export const patchTrackerToReadCanvas = (webgazer: WebGazer): void => {
	const tracker = webgazer.getTracker() as WebGazerTracker & { __voxmetrixCanvasInput?: boolean };
	if (!tracker || tracker.__voxmetrixCanvasInput) return;
	const original = tracker.getEyePatches.bind(tracker);
	tracker.getEyePatches = (_input, imageCanvas, width, height) =>
		original(imageCanvas, imageCanvas, width, height);
	tracker.__voxmetrixCanvasInput = true;
};
