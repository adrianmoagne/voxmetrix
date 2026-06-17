import type {
	ExperimentDefinition,
	ScreenBehaviorEntity,
	ScreenChildEntity,
	ScreenEntity,
	StepEntity,
} from "@/@types/screen.model";

const newUid = (): string => crypto.randomUUID();

const isScreenStep = (step: StepEntity): step is ScreenEntity => step.kind === "Screen";

const cloneScreenChild = (child: ScreenChildEntity, uid: string): ScreenChildEntity => {
	const clone = structuredClone(child);
	clone.uid = uid;

	if ("trackingTarget" in clone && clone.trackingTarget) {
		clone.trackingTarget = {
			...clone.trackingTarget,
			id: newUid(),
		};
	}

	return clone;
};

const cloneScreenBehavior = (
	behavior: ScreenBehaviorEntity,
	childUidMap: Map<string, string>
): ScreenBehaviorEntity => {
	const clone = structuredClone(behavior);
	clone.uid = newUid();

	if (clone.kind === "EyeTracking" && typeof clone.props.targets === "object") {
		clone.props.targets = {
			entityUids: clone.props.targets.entityUids.map((uid) => childUidMap.get(uid) ?? uid),
		};
	}

	if (clone.kind === "FixationGate" && typeof clone.props.reveal === "object") {
		clone.props.reveal = {
			entityUids: clone.props.reveal.entityUids.map((uid) => childUidMap.get(uid) ?? uid),
		};
	}

	return clone;
};

const cloneScreenStep = (step: ScreenEntity): ScreenEntity => {
	const childUidMap = new Map<string, string>();
	step.children.forEach((child) => {
		childUidMap.set(child.uid, newUid());
	});

	const clone = structuredClone(step);
	clone.uid = newUid();
	clone.children = step.children.map((child) =>
		cloneScreenChild(child, childUidMap.get(child.uid) ?? newUid())
	);
	clone.behaviors = (step.behaviors ?? []).map((behavior) =>
		cloneScreenBehavior(behavior, childUidMap)
	);

	return clone;
};

const cloneStep = (step: StepEntity): StepEntity => {
	if (isScreenStep(step)) {
		return cloneScreenStep(step);
	}

	return { ...structuredClone(step), uid: newUid() };
};

export const cloneExperimentDefinition = (
	source: ExperimentDefinition,
	options?: { nameSuffix?: string }
): ExperimentDefinition => {
	const suffix = options?.nameSuffix ?? " (copy)";
	const blockUidMap = new Map<string, string>();

	source.blocks.forEach((block) => {
		blockUidMap.set(block.uid, newUid());
	});

	const clone = structuredClone(source);
	clone.uid = newUid();
	clone.name = `${source.name}${suffix}`;
	clone.blocks = source.blocks.map((block) => ({
		...structuredClone(block),
		uid: blockUidMap.get(block.uid) ?? newUid(),
		steps: block.steps.map(cloneStep),
	}));
	clone.spreadsheet = {
		...structuredClone(source.spreadsheet),
		rows: source.spreadsheet.rows.map((row) => ({
			...structuredClone(row),
			uid: newUid(),
			blockUid: blockUidMap.get(row.blockUid) ?? row.blockUid,
		})),
	};

	return clone;
};
