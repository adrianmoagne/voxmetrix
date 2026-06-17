/**
 * Web Audio playback — full decode into memory, sample-accurate timing via AudioContext.
 */

let sharedContext: AudioContext | null = null;
const bufferCache = new Map<string, Promise<AudioBuffer>>();

export const getAudioContext = (): AudioContext => {
	if (!sharedContext) {
		sharedContext = new AudioContext();
	}
	return sharedContext;
};

export const resumeAudioContext = async (): Promise<AudioContext> => {
	const context = getAudioContext();
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

		const elapsed = this.context.currentTime - this.startedAtContextTime + this.offsetSec;
		return Math.min(Math.max(0, elapsed), this.durationSec);
	}

	async play(): Promise<void> {
		await resumeAudioContext();
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
		source.onended = () => {
			if (!this.playing) return;
			this.playing = false;
			this.ended = true;
			this.offsetSec = this.durationSec;
			this.source = null;
			this.stopProgressReporting();
			this.onProgressListener?.(100);
			this.onEndedListener?.();
		};

		this.source = source;
		const startAt = this.context.currentTime;
		this.startedAtContextTime = startAt;
		source.start(startAt, this.offsetSec);
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

		this.stopSource();
		this.playing = false;
		this.stopProgressReporting();
	}

	stop(): void {
		this.stopSource();
		this.playing = false;
		this.stopProgressReporting();
		this.offsetSec = 0;
		this.ended = false;
	}

	dispose(): void {
		this.stopSource();
		this.playing = false;
		this.stopProgressReporting();
		this.buffer = null;
		this.durationSec = 0;
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
