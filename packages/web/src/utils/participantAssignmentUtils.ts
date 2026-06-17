import type { ExperimentDefinition } from "@/@types/screen.model";

export const collectConditionGroups = (definition: ExperimentDefinition): string[] => {
	const groups = new Set<string>();

	for (const row of definition.spreadsheet.rows) {
		const condition = row.condition?.trim();
		if (condition) {
			groups.add(condition);
		}
	}

	return [...groups].sort();
};

export const resolveAssignmentGroups = (definition: ExperimentDefinition): string[] => {
	const configured = definition.participantAssignment?.groups
		?.map((group) => group.trim())
		.filter(Boolean);

	if (configured && configured.length > 0) {
		return configured;
	}

	return collectConditionGroups(definition);
};

export const isParticipantAssignmentEnabled = (
	definition: ExperimentDefinition
): boolean => {
	return definition.participantAssignment?.enabled === true;
};
