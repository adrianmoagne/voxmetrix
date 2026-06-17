import type { StepEntity } from "@/@types/screen.model";
import type { StoreDispatch } from "@/store";
import { blockEditorActions } from "@/store";
import { stepColors, STEP_ICON, STEP_LABEL } from "@/components/StepCatalog";
import { Monitor } from "react-feather";
import { FormFieldStyles as F } from "@/components/FormField";
import { StepCatalogStyles as SC } from "@/components/StepCatalog";
import S from "./StepPropertyForm.styles";

type Props = {
	step: StepEntity;
	dispatch: StoreDispatch;
};

const StepPropertyForm: React.FC<Props> = ({ step, dispatch }) => {
	const Icon = STEP_ICON[step.kind] ?? Monitor;
	const colors = stepColors[step.kind];

	const update = (props: Record<string, unknown>) => {
		dispatch(blockEditorActions.updateStepProps({ uid: step.uid, props }));
	};

	return (
		<S.Form>
			<S.Header>
				<SC.IconWrapper $kind={step.kind} style={{ width: 40, height: 40 }}>
					<Icon size={20} color={colors?.icon} />
				</SC.IconWrapper>
				<div>
					<S.Title>{step.name}</S.Title>
					<S.Subtitle>{STEP_LABEL[step.kind]}</S.Subtitle>
				</div>
			</S.Header>

			<F.Field>
				<F.Label>Name</F.Label>
				<F.Input
					value={step.name}
					onChange={(e) =>
						dispatch(blockEditorActions.renameStep({ uid: step.uid, name: e.target.value }))
					}
					placeholder="Step name"
				/>
			</F.Field>

			{step.kind === "FixationStep" && (
				<>
					<F.Field>
						<F.Label>Duration (ms)</F.Label>
						<F.Input
							type="number"
							value={typeof step.props.durationMs === "number" ? step.props.durationMs : 1000}
							onChange={(e) => update({ durationMs: Number(e.target.value) })}
							min={100}
							step={100}
						/>
						<F.Hint>How long the fixation cross is shown before the trial begins.</F.Hint>
					</F.Field>
					<F.Field>
						<F.Label>Hide cursor</F.Label>
						<F.Select
							value={step.props.hideCursor ? "true" : "false"}
							onChange={(e) => update({ hideCursor: e.target.value === "true" })}
						>
							<option value="false">No</option>
							<option value="true">Yes</option>
						</F.Select>
					</F.Field>
				</>
			)}

			{step.kind === "CalibrationStep" && (
				<F.Field>
					<F.Label>Preset</F.Label>
					<F.Select
						value={(step.props.preset as string) ?? "default"}
						onChange={(e) => update({ preset: e.target.value })}
					>
						<option value="default">Default (9-point)</option>
						<option value="fast">Fast (5-point)</option>
						<option value="precise">Precise (13-point)</option>
					</F.Select>
				</F.Field>
			)}

			{step.kind === "ValidationStep" && (
				<F.Field>
					<F.Label>Preset</F.Label>
					<F.Select
						value={(step.props.preset as string) ?? "default"}
						onChange={(e) => update({ preset: e.target.value })}
					>
						<option value="default">Default</option>
						<option value="strict">Strict</option>
					</F.Select>
				</F.Field>
			)}

			{step.kind === "FeedbackStep" && (
				<F.Field>
					<F.Label>Question Set ID</F.Label>
					<F.Input
						value={(step.props.questionSetId as string) ?? ""}
						onChange={(e) => update({ questionSetId: e.target.value })}
						placeholder="e.g. mos-feedback"
					/>
					<F.Hint>References the form/question set shown to the participant.</F.Hint>
				</F.Field>
			)}
		</S.Form>
	);
};

export default StepPropertyForm;
