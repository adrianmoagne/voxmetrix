import { isAxiosError } from "axios";
import { SessionService, type SessionRef } from "@/api/services/SessionService";

/**
 * Saves a participant's steps one by one as they complete. Each step is kept in
 * memory and in IndexedDB (so a reload in the same browser still has it) and sent
 * to the server when the browser is idle, retrying with backoff until it lands.
 */

const DB_NAME = "voxmetrix-participant";
const STORE = "steps";
const POINTER_PREFIX = "voxmetrix.session.";
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000, 30000];

interface StoredStep {
	resultId: string;
	seq: number;
	step: unknown;
}

// --- Session pointer: which session this browser has open for an experiment ---

export const readSessionPointer = (experimentId: string): SessionRef | null => {
	try {
		const raw = localStorage.getItem(POINTER_PREFIX + experimentId);
		if (!raw) return null;
		const { resultId, token } = JSON.parse(raw) as Partial<SessionRef>;
		return typeof resultId === "string" && typeof token === "string"
			? { experimentId, resultId, token }
			: null;
	} catch {
		return null;
	}
};

export const writeSessionPointer = (session: SessionRef): void => {
	try {
		localStorage.setItem(
			POINTER_PREFIX + session.experimentId,
			JSON.stringify({ resultId: session.resultId, token: session.token })
		);
	} catch {
		// Without storage the session still runs; it just cannot be resumed after a reload.
	}
};

export const clearSessionPointer = (experimentId: string): void => {
	try {
		localStorage.removeItem(POINTER_PREFIX + experimentId);
	} catch {
		// Nothing to clear.
	}
};

// --- IndexedDB backup ---

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
	new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
	dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			const store = request.result.createObjectStore(STORE, { keyPath: ["resultId", "seq"] });
			store.createIndex("resultId", "resultId");
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	}).catch((error) => {
		dbPromise = null;
		throw error;
	});
	return dbPromise;
};

const withStore = async <T>(
	mode: IDBTransactionMode,
	run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
	const db = await openDb();
	return requestResult(run(db.transaction(STORE, mode).objectStore(STORE)));
};

const backupStep = (entry: StoredStep) => withStore("readwrite", (store) => store.put(entry));

const loadBackedUpSteps = (resultId: string) =>
	withStore<StoredStep[]>("readonly", (store) =>
		store.index("resultId").getAll(IDBKeyRange.only(resultId))
	);

const deleteBackedUpSteps = (resultId: string) =>
	withStore("readwrite", (store) =>
		store.delete(IDBKeyRange.bound([resultId, 0], [resultId, Number.MAX_SAFE_INTEGER]))
	);

// --- Recorder ---

const whenIdle = (callback: () => void): void => {
	if (typeof window.requestIdleCallback === "function") {
		window.requestIdleCallback(callback, { timeout: 1000 });
	} else {
		setTimeout(callback, 50);
	}
};

/** Errors retrying cannot fix: the server refused the step itself or the session. */
const isFatal = (error: unknown): boolean => {
	const status = isAxiosError(error) ? error.response?.status : undefined;
	return status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 429;
};

export class SessionSaveError extends Error {
	constructor(message: string, readonly cause?: unknown) {
		super(message);
		this.name = "SessionSaveError";
	}
}

export class ResultSessionRecorder {
	private readonly steps = new Map<number, { step: unknown; saved: boolean }>();
	private flushing = false;
	private retryAttempt = 0;
	private retryTimer: ReturnType<typeof setTimeout> | null = null;
	private fatalError: SessionSaveError | null = null;
	private readonly listeners = new Set<() => void>();

	constructor(readonly session: SessionRef) {}

	/** Restores steps this browser kept for the session; those from `fromSeq` on are sent again. */
	async restoreBackup(fromSeq: number): Promise<void> {
		let backedUp: StoredStep[] = [];
		try {
			backedUp = await loadBackedUpSteps(this.session.resultId);
		} catch {
			return;
		}
		for (const { seq, step } of backedUp) {
			if (!this.steps.has(seq)) this.steps.set(seq, { step, saved: seq < fromSeq });
		}
		this.flush();
	}

	/** Records a completed step. Never blocks: storing and sending wait for an idle moment. */
	save(seq: number, step: unknown): void {
		this.steps.set(seq, { step, saved: false });
		this.notify();
		whenIdle(() => {
			void backupStep({ resultId: this.session.resultId, seq, step }).catch(() => undefined);
			this.flush();
		});
	}

	get hasUnsavedSteps(): boolean {
		return [...this.steps.values()].some((entry) => !entry.saved);
	}

	/** Every step recorded in this browser, in order (for the participant to download). */
	allSteps(): { seq: number; step: unknown }[] {
		return [...this.steps.entries()]
			.sort(([a], [b]) => a - b)
			.map(([seq, { step }]) => ({ seq, step }));
	}

	/** Resolves once every recorded step is on the server. */
	whenSaved(timeoutMs: number): Promise<void> {
		this.retryNow();
		return new Promise((resolve, reject) => {
			const check = () => {
				if (this.fatalError) return finish(this.fatalError);
				if (!this.hasUnsavedSteps) return finish();
			};
			const timer = setTimeout(
				() => finish(new SessionSaveError("Timed out while saving responses")),
				timeoutMs
			);
			const finish = (error?: Error) => {
				clearTimeout(timer);
				this.listeners.delete(check);
				if (error) reject(error);
				else resolve();
			};
			this.listeners.add(check);
			check();
		});
	}

	/** Marks the session complete once all `stepCount` steps are saved; resends any the server lacks. */
	async complete(stepCount: number, timeoutMs: number): Promise<void> {
		await this.whenSaved(timeoutMs);
		try {
			await SessionService.completeSession(this.session, stepCount);
		} catch (error) {
			const missing = isAxiosError(error) ? error.response?.data?.missing : undefined;
			if (!Array.isArray(missing) || missing.length === 0) {
				throw new SessionSaveError("Could not complete the session", error);
			}
			for (const seq of missing) {
				const entry = this.steps.get(seq);
				if (entry) entry.saved = false;
			}
			await this.whenSaved(timeoutMs);
			await SessionService.completeSession(this.session, stepCount);
		}
		await deleteBackedUpSteps(this.session.resultId).catch(() => undefined);
	}

	/** Retries a failed save immediately, e.g. when the participant presses "Try again". */
	retryNow(): void {
		if (this.fatalError) return;
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
			this.retryTimer = null;
		}
		this.flush();
	}

	private notify(): void {
		for (const listener of [...this.listeners]) listener();
	}

	private nextUnsaved(): number | undefined {
		let next: number | undefined;
		for (const [seq, entry] of this.steps) {
			if (!entry.saved && (next === undefined || seq < next)) next = seq;
		}
		return next;
	}

	private async flush(): Promise<void> {
		if (this.flushing || this.retryTimer || this.fatalError) return;
		this.flushing = true;
		try {
			for (let seq = this.nextUnsaved(); seq !== undefined; seq = this.nextUnsaved()) {
				const entry = this.steps.get(seq)!;
				try {
					await SessionService.saveStep(this.session, seq, entry.step);
				} catch (error) {
					const status = isAxiosError(error) ? error.response?.status : undefined;
					if (status === 409) {
						// The session was completed meanwhile, so the server already has every step.
					} else if (isFatal(error)) {
						this.fatalError = new SessionSaveError("The server refused a response", error);
						return;
					} else {
						const delay =
							RETRY_DELAYS_MS[Math.min(this.retryAttempt, RETRY_DELAYS_MS.length - 1)];
						this.retryAttempt += 1;
						this.retryTimer = setTimeout(() => {
							this.retryTimer = null;
							this.flush();
						}, delay);
						return;
					}
				}
				// A newer copy recorded while this one was in flight still has to go.
				if (this.steps.get(seq) === entry) entry.saved = true;
				this.retryAttempt = 0;
			}
		} finally {
			this.flushing = false;
			this.notify();
		}
	}
}