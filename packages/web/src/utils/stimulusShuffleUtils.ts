import type {
	BindingRef,
	Bound,
	ScreenChildEntity,
	ScreenEntity,
	SpreadsheetRow,
	StimulusShuffleAssignment,
	StimulusShufflePresentation,
} from "@/@types/screen.model";

/** Entity kinds whose content can be shuffled, and the prop that holds that content. */
export const SHUFFLEABLE_SOURCE_PROPS = {
	AudioPlayer: "audioSrc",
	Image: "imageSrc",
	Text: "text",
} as const;

type ShuffleableKind = keyof typeof SHUFFLEABLE_SOURCE_PROPS;

const isBindingRef = (value: Bound<unknown> | undefined): value is BindingRef<unknown> =>
	typeof value === "object" &&
	value !== null &&
	(value as BindingRef<unknown>).kind === "binding";

export const isShuffleableEntity = (
	entity: ScreenChildEntity
): entity is Extract<ScreenChildEntity, { kind: ShuffleableKind }> =>
	entity.kind in SHUFFLEABLE_SOURCE_PROPS;

/** The spreadsheet column an entity's content is bound to, if any. */
export const getShuffleSourceColumn = (entity: ScreenChildEntity): string | undefined => {
	if (!isShuffleableEntity(entity)) return undefined;
	const source = (entity.props as Record<string, Bound<unknown>>)[
		SHUFFLEABLE_SOURCE_PROPS[entity.kind]
	];
	return isBindingRef(source) && source.column.trim() ? source.column : undefined;
};

const rebindSource = (entity: ScreenChildEntity, column: string): ScreenChildEntity => {
	if (!isShuffleableEntity(entity)) return entity;
	const propName = SHUFFLEABLE_SOURCE_PROPS[entity.kind];
	const source = (entity.props as Record<string, Bound<unknown>>)[propName];
	if (!isBindingRef(source)) return entity;

	return {
		...entity,
		props: { ...entity.props, [propName]: { ...source, column } },
	} as ScreenChildEntity;
};

const shuffledIndexes = (length: number, random: () => number): number[] => {
	const indexes = Array.from({ length }, (_, index) => index);
	for (let i = indexes.length - 1; i > 0; i -= 1) {
		const j = Math.floor(random() * (i + 1));
		[indexes[i], indexes[j]] = [indexes[j], indexes[i]];
	}
	return indexes;
};

/**
 * Applies a screen's ShuffleStimuli behavior for one trial: the selected entities' bound
 * columns are randomly permuted among them. Returns a per-trial copy of the screen in which
 * each selected entity is bound to the column it shows, plus a record of the assignment.
 * Other entities bound to the same columns are not affected.
 */
export const applyStimulusShuffle = (
	screen: ScreenEntity,
	row: SpreadsheetRow,
	random: () => number = Math.random
): { screen: ScreenEntity; shuffle?: StimulusShufflePresentation } => {
	const behavior = screen.behaviors?.find((entry) => entry.kind === "ShuffleStimuli");
	if (!behavior || behavior.kind !== "ShuffleStimuli") return { screen };

	const selected = new Set(behavior.props.entityUids ?? []);
	const candidates = screen.children
		.map((entity) => ({ entity, column: getShuffleSourceColumn(entity) }))
		.filter(
			(candidate): candidate is { entity: ScreenChildEntity; column: string } =>
				selected.has(candidate.entity.uid) && candidate.column !== undefined
		);
	if (candidates.length < 2) return { screen };

	const order = shuffledIndexes(candidates.length, random);
	const shownColumnByUid = new Map<string, string>();
	const assignments: StimulusShuffleAssignment[] = candidates.map(({ entity, column }, index) => {
		const shownColumn = candidates[order[index]].column;
		shownColumnByUid.set(entity.uid, shownColumn);
		return {
			entityUid: entity.uid,
			entityName: entity.name,
			column,
			shownColumn,
			value: row.values[shownColumn],
		};
	});

	return {
		screen: {
			...screen,
			children: screen.children.map((entity) => {
				const shownColumn = shownColumnByUid.get(entity.uid);
				return shownColumn ? rebindSource(entity, shownColumn) : entity;
			}),
		},
		shuffle: { assignments },
	};
};
