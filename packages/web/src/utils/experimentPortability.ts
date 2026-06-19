import type { ExperimentDefinition } from "@/@types/screen.model";

/** Marker used to recognise files exported from Voxmetric. */
const EXPORT_TYPE = "voxmetric/experiment-definition";

interface ExperimentExportFile {
	$type: typeof EXPORT_TYPE;
	exportedAt: string;
	definition: ExperimentDefinition;
}

const sanitizeFileName = (name: string): string => {
	const trimmed = name.trim().replace(/[^a-z0-9-_]+/gi, "_").replace(/_+/g, "_");
	return trimmed.replace(/^_|_$/g, "") || "experiment";
};

/** Trigger a browser download of an experiment definition as a portable JSON file. */
export const downloadExperimentDefinition = (definition: ExperimentDefinition): void => {
	const payload: ExperimentExportFile = {
		$type: EXPORT_TYPE,
		exportedAt: new Date().toISOString(),
		definition,
	};

	const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${sanitizeFileName(definition.name)}.experiment.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

const isExperimentDefinition = (value: unknown): value is ExperimentDefinition => {
	if (!value || typeof value !== "object") return false;
	const def = value as Partial<ExperimentDefinition>;
	return (
		def.schemaVersion === 2 &&
		typeof def.name === "string" &&
		Array.isArray(def.blocks) &&
		!!def.spreadsheet &&
		typeof def.spreadsheet === "object" &&
		Array.isArray(def.spreadsheet.rows) &&
		Array.isArray(def.spreadsheet.columns)
	);
};

/**
 * Parse and validate a previously exported experiment file. Accepts both the
 * wrapped export format and a bare experiment definition. Throws on invalid input.
 */
export const parseExperimentDefinitionFile = (text: string): ExperimentDefinition => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error("File is not valid JSON.");
	}

	const candidate =
		parsed && typeof parsed === "object" && "definition" in parsed
			? (parsed as ExperimentExportFile).definition
			: parsed;

	if (!isExperimentDefinition(candidate)) {
		throw new Error("File does not contain a valid experiment definition.");
	}

	return candidate;
};
