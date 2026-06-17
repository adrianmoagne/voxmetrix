import type { ExperimentDefinition } from "./experiment-definition.types";

export class ParticipantConditionError extends Error {
	constructor(
		public readonly code:
			| "NO_GROUPS"
			| "MISSING_URL_CONDITION"
			| "INVALID_URL_CONDITION",
		message: string,
		public readonly details?: Record<string, unknown>
	) {
		super(message);
		this.name = "ParticipantConditionError";
	}
}

export const collectConditionGroups = (definition: ExperimentDefinition): string[] => {
	const groups = new Set<string>();

	for (const row of definition.spreadsheet.rows) {
		const condition = typeof row.condition === "string" ? row.condition.trim() : "";
		if (condition) {
			groups.add(condition);
		}
	}

	return [...groups].sort();
};

export const resolveAssignmentGroups = (definition: ExperimentDefinition): string[] => {
	const assignment = definition.participantAssignment;
	const configuredGroups = Array.isArray(assignment?.groups)
		? assignment.groups.map((group) => group.trim()).filter(Boolean)
		: [];

	if (configuredGroups.length > 0) {
		return configuredGroups;
	}

	return collectConditionGroups(definition);
};

export const pickRandomCondition = (groups: string[]): string => {
	if (groups.length === 0) {
		throw new ParticipantConditionError(
			"NO_GROUPS",
			"No participant conditions are configured for this experiment."
		);
	}

	const index = Math.floor(Math.random() * groups.length);
	return groups[index]!;
};

interface ResolveParticipantConditionOptions {
	existingCondition?: string;
	urlCondition?: string;
}

export const resolveParticipantCondition = (
	definition: ExperimentDefinition,
	options: ResolveParticipantConditionOptions = {}
): string | undefined => {
	const assignment = definition.participantAssignment;
	if (!assignment?.enabled) {
		return undefined;
	}

	const groups = resolveAssignmentGroups(definition);
	if (groups.length === 0) {
		throw new ParticipantConditionError(
			"NO_GROUPS",
			"No participant conditions are configured for this experiment."
		);
	}

	const existing = options.existingCondition?.trim();
	if (existing && groups.includes(existing)) {
		return existing;
	}

	const mode = assignment.mode ?? "random";
	if (mode === "url") {
		const urlCondition = options.urlCondition?.trim();
		if (!urlCondition) {
			throw new ParticipantConditionError(
				"MISSING_URL_CONDITION",
				"This experiment requires a condition in the URL (?condition=)."
			);
		}

		if (!groups.includes(urlCondition)) {
			throw new ParticipantConditionError(
				"INVALID_URL_CONDITION",
				`Condition "${urlCondition}" is not available for this experiment.`,
				{ requested: urlCondition, available: groups }
			);
		}

		return urlCondition;
	}

	return pickRandomCondition(groups);
};

export const isParticipantConditionError = (
	error: unknown
): error is ParticipantConditionError => error instanceof ParticipantConditionError;
