import type { Bound, BindingRef, SpreadsheetRow } from "@/@types/screen.model";

export function isBinding<T>(value: Bound<T>): value is BindingRef<T> {
	return (
		value !== null &&
		typeof value === "object" &&
		"kind" in value &&
		(value as BindingRef<T>).kind === "binding"
	);
}

export function resolveBound<T>(value: Bound<T>, row?: SpreadsheetRow): T {
	if (!isBinding(value)) return value;

	const resolved = row?.values[value.column];
	if (resolved !== undefined) return resolved as unknown as T;
	if (value.fallback !== undefined) return value.fallback;
	if (value.required) {
		throw new Error(`Missing required binding: ${value.column}`);
	}
	return undefined as unknown as T;
}
