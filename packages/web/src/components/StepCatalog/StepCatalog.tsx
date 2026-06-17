import { Monitor, Crosshair, Eye, CheckCircle, MessageSquare } from "react-feather";
import type { StepEntity, ScreenEntity } from "@/@types/screen.model";
import S, { stepColors } from "./StepCatalog.styles";

export { stepColors };

export const STEP_ICON: Record<string, React.FC<{ size?: number; color?: string }>> = {
	Screen: Monitor,
	FixationStep: Crosshair,
	CalibrationStep: Eye,
	ValidationStep: CheckCircle,
	FeedbackStep: MessageSquare,
};

export const STEP_LABEL: Record<string, string> = {
	Screen: "Screen",
	FixationStep: "Fixation",
	CalibrationStep: "Calibration",
	ValidationStep: "Validation",
	FeedbackStep: "Feedback",
};

export const STEP_DESCRIPTION: Record<string, string> = {
	Screen: "Visual trial screen",
	FixationStep: "Fixation cross",
	CalibrationStep: "Eye tracking calibration",
	ValidationStep: "Gaze validation",
	FeedbackStep: "Participant feedback",
};

export const CATALOG_STEPS: StepEntity["kind"][] = [
	"Screen", "FixationStep", "CalibrationStep", "ValidationStep", "FeedbackStep",
];

export function makeStep(kind: StepEntity["kind"]): StepEntity {
	const uid = crypto.randomUUID();
	switch (kind) {
		case "Screen":
			return {
				uid, kind, name: "New Screen",
				props: { grid: { type: "3x3", subtype: "equal" } },
				children: [], behaviors: [],
			} as ScreenEntity;
		case "FixationStep":
			return { uid, kind, name: "Fixation", props: { durationMs: 1000 } };
		case "CalibrationStep":
			return { uid, kind, name: "Calibration", props: {} };
		case "ValidationStep":
			return { uid, kind, name: "Validation", props: {} };
		case "FeedbackStep":
			return { uid, kind, name: "Feedback", props: {} };
	}
}

type Props = {
	open: boolean;
	onSelect: (kind: StepEntity["kind"]) => void;
};

const StepCatalog: React.FC<Props> = ({ open, onSelect }) => {
	if (!open) return null;

	return (
		<S.Dropdown>
			{CATALOG_STEPS.map((kind) => {
				const Icon = STEP_ICON[kind] ?? Monitor;
				return (
					<S.Item key={kind} $kind={kind} onClick={() => onSelect(kind)}>
						<S.ItemIcon $kind={kind}>
							<Icon size={14} color={stepColors[kind]?.icon} />
						</S.ItemIcon>
						<div>
							<S.ItemLabel>{STEP_LABEL[kind]}</S.ItemLabel>
							<S.ItemSub>{STEP_DESCRIPTION[kind]}</S.ItemSub>
						</div>
					</S.Item>
				);
			})}
		</S.Dropdown>
	);
};

export { S as StepCatalogStyles };
export default StepCatalog;
