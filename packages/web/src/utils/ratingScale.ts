import type { RatingOption } from "@/@types/screen.model";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === "object" && !Array.isArray(value);

/**
 * Normalizes a RatingScale `scale` into `{ value, label }` options, one per entry so indexes
 * stay aligned with the definition. Legacy string entries score their position (1-based).
 * Mirrors `normalizeRatingOptions` in the server's result enrichment.
 */
export const normalizeRatingOptions = (scale: unknown): RatingOption[] => {
	if (!Array.isArray(scale)) return [];

	return scale.map((option, index) => {
		if (isRecord(option)) {
			const value = Number(option.value);
			return {
				value: Number.isFinite(value) ? value : index + 1,
				label: typeof option.label === "string" ? option.label : String(option.label ?? ""),
			};
		}

		return { value: index + 1, label: String(option ?? "") };
	});
};
