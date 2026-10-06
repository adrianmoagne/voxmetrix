/**
 * Web Audio playback — full decode into memory, sample-accurate timing via AudioContext.
 *
 * Every playback segment is scheduled slightly in the future so its start is an exact
 * context time, and the track keeps a log of segments so any moment on the audio output
 * clock can be mapped back to a clip position (see `positionAtContextTime`).
 */

let sharedContext: AudioContext | null = null;
const bufferCache = new Map<string, Promise<AudioBuffer>>();

/**
 * Lead time between scheduling and audible start. `source.start(currentTime)` would snap to
 * a later render quantum than the value we store; a future start makes the anchor exact.
 */
export const PLAYBACK_START_LEAD_SEC = 0.05;

export type AudioClockAnchorSource = "outputTimestamp" | "currentTime";

/**
 * One pairing of the audio output clock with `performance.now()`.
 *
 * With `getOutputTimestamp()`, `contextTime` is the sample frame that was leaving the output
 * device at `performanceTime`, so output latency is already inside the pair. The fallback
 * pairs the render clock (`currentTime`) with the wall clock and carries no latency.
 */
export interface AudioClockAnchor {
	performanceTime: number;
	contextTime: number;
	source: AudioClockAnchorSource;
	/** `performance.now()` when the pair was read; `performanceTime` of an output pair is older. */
	sampledAt: number;
	/** Context state when the pair was read; the pair only tracks real time while `running`. */
	contextState: AudioContextState;
	/** `currentTime` at `sampledAt`: the render clock, ahead of the output by the output latency. */
	renderContextTime: number;
}

export const sampleAudioClockAnchor = (context: AudioContext): AudioClockAnchor => {
	const sampledAt = performance.now();
	const contextState = context.state;
	const renderContextTime = context.currentTime;
	if (contextState === "running" && typeof context.getOutputTimestamp === "function") {
		const stamp = context.getOutputTimestamp();
		if (
			typeof stamp.contextTime === "number" &&
			typeof stamp.performanceTime === "number" &&
			stamp.performanceTime > 0
		) {
			return {
				performanceTime: stamp.performanceTime,
				contextTime: stamp.contextTime,
				source: "outputTimestamp",
				sampledAt,
				contextState,
				renderContextTime,
			};
		}
	}

	return {
		performanceTime: sampledAt,
		contextTime: renderContextTime,
		source: "currentTime",
		sampledAt,
		contextState,
		renderContextTime,
	};
};

/** Context time that was at the output when `performanceTime` happened, per `anchor`. */
export const contextTimeAtPerformanceTime = (
	anchor: AudioClockAnchor,
	performanceTime: number
): number => anchor.contextTime + (performanceTime - anchor.performanceTime) / 1000;

/** `performance.now()` at which `contextTime` was (or will be) at the output, per `anchor`. */
export const performanceTimeAtContextTime = (
	anchor: AudioClockAnchor,
	contextTime: number
): number => anchor.performanceTime + (contextTime - anchor.contextTime) * 1000;

export interface AudioContextInfo {
	sampleRate: number;
	baseLatency: number | null;
	outputLatency: number | null;
	state: AudioContextState;
}

export const describeAudioContext = (context: AudioContext): AudioContextInfo => ({
	sampleRate: context.sampleRate,
	baseLatency: typeof context.baseLatency === "number" ? context.baseLatency : null,
	outputLatency: typeof context.outputLatency === "number" ? context.outputLatency : null,
	state: context.state,
});

export type PlaybackSegmentEndReason = "ended" | "paused" | "stopped" | "disposed";

/** One contiguous run of a buffer source, on the context clock (seconds). */
export interface PlaybackSegment {
	id: number;
	/** Exact context time at which the source was scheduled to start. */
	startContextTime: number;
	/** Clip position (seconds) at `startContextTime`. */
	offsetSec: number;
	/**
	 * Context time at which the clip runs out if nothing stops it first. Known when the segment
	 * is scheduled, so the segment is bounded before `onended` arrives. Assumes playback rate 1
	 * and no looping.
	 */
	scheduledEndContextTime: number;
	/** When the segment actually stopped; never later than `scheduledEndContextTime`. */
	endContextTime: number | null;
	endReason: PlaybackSegmentEndReason | null;
	/** `performance.now()` and clock anchor at the moment `play()` scheduled the segment. */
	scheduledAtPerformanceTime: number;
	scheduledAnchor: AudioClockAnchor;
}

export interface AudioTrackTimeline {
	src: string;
	durationSec: number;
	startLeadSec: number;
	segments: PlaybackSegment[];
	context: AudioContextInfo;
}

export interface AudioPositionAtTime {
	segmentId: number;
	positionSec: number;
	/** Context time at which the covering segment started. */
	startContextTime: number;
}

export const getAudioContext = (): AudioContext => {
	if (!sharedContext) {
		sharedContext = new AudioContext();
	}
	return sharedContext;
};

export const resumeAudioContext = async (
	context: AudioContext = getAudioContext()
): Promise<AudioContext> => {
	if (context.state === "suspended") {
		await context.resume();
	}
	return context;
};

export const loadAudioBuffer = async (src: string): Promise<AudioBuffer> => {
	const cached = bufferCache.get(src);
	if (cached) {
		return cached;
	}

	const pending = (async () => {
		const context = getAudioContext();
		const response = await fetch(src);
		if (!response.ok) {
			throw new Error(`Failed to load audio (${response.status})`);
		}
		const data = await response.arrayBuffer();
		return context.decodeAudioData(data);
	})();

	bufferCache.set(src, pending);

	try {
		return await pending;
	} catch (error) {
		bufferCache.delete(src);
		throw error;
	}
};

export type WebAudioPlaybackListener = () => void;
export type WebAudioProgressListener = (progressPercent: number) => void;

export class WebAudioTrack {
	private buffer: AudioBuffer | null = null;
	private durationSec = 0;
	private source: AudioBufferSourceNode | null = null;
	private startedAtContextTime = 0;
	private offsetSec = 0;
	private playing = false;
	private ended = false;
	private progressRafId: number | null = null;
	private onEndedListener: WebAudioPlaybackListener | null = null;
	private onPlayingListener: WebAudioPlaybackListener | null = null;
	private onProgressListener: WebAudioProgressListener | null = null;
	private segments: PlaybackSegment[] = [];

	constructor(private readonly context: AudioContext, private readonly src: string) {}

	get duration(): number {
		return this.durationSec;
	}

	get isPlaying(): boolean {
		return this.playing;
	}

	get isEnded(): boolean {
		return this.ended;
	}

	get audioContext(): AudioContext {
		return this.context;
	}

	/** Segment log plus context diagnostics; enough to redo any time mapping offline. */
	getTimeline(): AudioTrackTimeline {
		return {
			src: this.src,
			durationSec: this.durationSec,
			startLeadSec: PLAYBACK_START_LEAD_SEC,
			segments: this.segments.map((segment) => ({ ...segment })),
			context: describeAudioContext(this.context),
		};
	}

	/**
	 * Clip position that was playing at `contextTime`, or null when no segment covers it
	 * (not yet started, paused, or finished).
	 */
	positionAtContextTime(contextTime: number): AudioPositionAtTime | null {
		for (let i = this.segments.length - 1; i >= 0; i--) {
			const segment = this.segments[i];
			if (contextTime < segment.startContextTime) continue;
			if (contextTime >= (segment.endContextTime ?? segment.scheduledEndContextTime)) continue;

			const position = segment.offsetSec + (contextTime - segment.startContextTime);
			return {
				segmentId: segment.id,
				positionSec: Math.min(Math.max(0, position), this.durationSec),
				startContextTime: segment.startContextTime,
			};
		}
		return null;
	}

	/** Clip position that was at the output device when `performanceTime` happened. */
	positionAtPerformanceTime(
		performanceTime: number,
		anchor: AudioClockAnchor = sampleAudioClockAnchor(this.context)
	): AudioPositionAtTime | null {
		return this.positionAtContextTime(contextTimeAtPerformanceTime(anchor, performanceTime));
	}

	/**
	 * `performance.now()` at which the latest segment stops being heard: its end, or the current
	 * render time while it is still playing. Null when the track never played.
	 */
	audibleUntil(anchor: AudioClockAnchor = sampleAudioClockAnchor(this.context)): number | null {
		const last = this.segments[this.segments.length - 1];
		if (!last) return null;
		const end =
			last.endContextTime ?? Math.min(this.context.currentTime, last.scheduledEndContextTime);
		return performanceTimeAtContextTime(anchor, end);
	}

	private closeSegment(endContextTime: number, reason: PlaybackSegmentEndReason): void {
		const current = this.segments[this.segments.length - 1];
		if (!current || current.endContextTime !== null) return;
		// Stopping after the clip already ran out (before `onended` fired) still ends it naturally.
		const ranOut = endContextTime >= current.scheduledEndContextTime;
		current.endContextTime = ranOut
			? current.scheduledEndContextTime
			: Math.max(current.startContextTime, endContextTime);
		current.endReason = ranOut ? "ended" : reason;
	}

	setOnEnded(listener: WebAudioPlaybackListener | null): void {
		this.onEndedListener = listener;
	}

	setOnPlaying(listener: WebAudioPlaybackListener | null): void {
		this.onPlayingListener = listener;
	}

	setOnProgress(listener: WebAudioProgressListener | null): void {
		this.onProgressListener = listener;
	}

	async preload(): Promise<void> {
		if (this.buffer) return;
		this.buffer = await loadAudioBuffer(this.src);
		this.durationSec = this.buffer.duration;
	}

	/** Seconds elapsed in the current clip, or null when not actively playing. */
	getPlaybackTime(): number | null {
		if (!this.playing || !this.buffer) {
			return null;
		}

		// Before a scheduled start the clip is still at its offset, not behind it.
		const elapsed = Math.max(0, this.context.currentTime - this.startedAtContextTime);
		return Math.min(this.offsetSec + elapsed, this.durationSec);
	}

	async play(): Promise<void> {
		await resumeAudioContext(this.context);
		await this.preload();

		if (!this.buffer) {
			return;
		}

		if (this.playing) {
			return;
		}

		if (this.ended) {
			this.ended = false;
			this.offsetSec = 0;
			this.onProgressListener?.(0);
		}

		this.stopSource();

		const source = this.context.createBufferSource();
		source.buffer = this.buffer;
		source.connect(this.context.destination);

		const startAt = this.context.currentTime + PLAYBACK_START_LEAD_SEC;
		const offsetSec = this.offsetSec;
		const remainingSec = Math.max(0, this.durationSec - offsetSec);
		const scheduledEndContextTime = startAt + remainingSec;
		this.segments.push({
			id: this.segments.length,
			startContextTime: startAt,
			offsetSec,
			scheduledEndContextTime,
			endContextTime: null,
			endReason: null,
			scheduledAtPerformanceTime: performance.now(),
			scheduledAnchor: sampleAudioClockAnchor(this.context),
		});

		source.onended = () => {
			if (!this.playing) return;
			this.closeSegment(scheduledEndContextTime, "ended");
			this.playing = false;
			this.ended = true;
			this.offsetSec = this.durationSec;
			this.source = null;
			this.stopProgressReporting();
			this.onProgressListener?.(100);
			this.onEndedListener?.();
		};

		this.source = source;
		this.startedAtContextTime = startAt;
		source.start(startAt, offsetSec);
		this.playing = true;
		this.startProgressReporting();
		this.onPlayingListener?.();
	}

	pause(): void {
		if (!this.playing) return;

		const position = this.getPlaybackTime();
		if (position !== null) {
			this.offsetSec = position;
		}

		this.closeSegment(this.context.currentTime, "paused");
		this.stopSource();
		this.playing = false;
		this.stopProgressReporting();
	}

	stop(): void {
		this.closeSegment(this.context.currentTime, "stopped");
		this.stopSource();
		this.playing = false;
		this.stopProgressReporting();
		this.offsetSec = 0;
		this.ended = false;
	}

	dispose(): void {
		this.closeSegment(this.context.currentTime, "disposed");
		this.stopSource();
		this.playing = false;
		this.stopProgressReporting();
		this.buffer = null;
		this.onEndedListener = null;
		this.onPlayingListener = null;
		this.onProgressListener = null;
	}

	private startProgressReporting(): void {
		this.stopProgressReporting();

		const duration = this.durationSec;
		if (duration <= 0) return;

		const tick = () => {
			if (!this.playing) {
				this.progressRafId = null;
				return;
			}

			const position = this.getPlaybackTime();
			if (position !== null) {
				this.onProgressListener?.((position / duration) * 100);
			}

			this.progressRafId = requestAnimationFrame(tick);
		};

		tick();
	}

	private stopProgressReporting(): void {
		if (this.progressRafId !== null) {
			cancelAnimationFrame(this.progressRafId);
			this.progressRafId = null;
		}
	}

	private stopSource(): void {
		if (!this.source) return;

		this.source.onended = null;
		try {
			this.source.stop();
		} catch {
			// Already stopped.
		}
		this.source.disconnect();
		this.source = null;
	}
}

export const createWebAudioTrack = (src: string): WebAudioTrack =>
	new WebAudioTrack(getAudioContext(), src);
