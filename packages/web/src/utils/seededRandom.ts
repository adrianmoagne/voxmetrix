/**
 * Seeded randomness for a participant session. Every random choice of the session
 * (row order, side swaps, stimulus shuffles) draws from one generator, so the
 * stored seed rebuilds exactly the same trials when the participant resumes.
 */

/** A random 32-bit unsigned seed. */
export const randomSeed = (): number => {
	const values = new Uint32Array(1);
	crypto.getRandomValues(values);
	return values[0];
};

/** Mulberry32: a small, fast generator with a 32-bit state; returns values in [0, 1). */
export const createSeededRandom = (seed: number): (() => number) => {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};