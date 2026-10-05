import { Plus, X } from "react-feather";
import type { Bound, RatingOption, RatingScaleOption } from "@/@types/screen.model";
import { isBinding } from "@/components/ScreenEntityRenderer/resolveBound";
import { normalizeRatingOptions } from "@/utils";
import BoundField from "./BoundField";
import S from "./ScreenEntityEditor.styles";

interface RatingOptionsFieldProps {
	label: string;
	value: Bound<RatingScaleOption[]>;
	onChange: (value: Bound<RatingScaleOption[]>) => void;
}

const RatingOptionsField: React.FC<RatingOptionsFieldProps> = ({ label, value, onChange }) => {
	if (isBinding(value)) {
		return (
			<BoundField
				label={label}
				value={value}
				onChange={(next) => onChange(next as Bound<RatingScaleOption[]>)}
				type="string[]"
			/>
		);
	}

	const options = normalizeRatingOptions(value);

	const updateOption = (index: number, patch: Partial<RatingOption>) => {
		onChange(options.map((option, i) => (i === index ? { ...option, ...patch } : option)));
	};

	const handleValueChange = (index: number, raw: string) => {
		const parsed = raw === "" ? 0 : Number(raw);
		if (Number.isFinite(parsed)) updateOption(index, { value: parsed });
	};

	const handleAdd = () => {
		const lastValue = options.length > 0 ? options[options.length - 1].value : 0;
		onChange([...options, { value: lastValue + 1, label: "" }]);
	};

	const handleRemove = (index: number) => {
		onChange(options.filter((_, i) => i !== index));
	};

	return (
		<S.BoundFieldWrapper>
			<S.BoundFieldRow>
				<S.PropertyLabel style={{ flex: 1 }}>{label}</S.PropertyLabel>
				<S.BindingToggle
					$active={false}
					onClick={() => onChange({ kind: "binding", column: "" })}
				>
					Value
				</S.BindingToggle>
			</S.BoundFieldRow>
			{options.map((option, index) => (
				<S.OptionRow key={index}>
					<S.FieldInput
						type="number"
						value={option.value}
						onChange={(e) => handleValueChange(index, e.target.value)}
						aria-label={`Option ${index + 1} score`}
					/>
					<S.FieldInput
						value={option.label}
						onChange={(e) => updateOption(index, { label: e.target.value })}
						placeholder="Label shown to participants"
						aria-label={`Option ${index + 1} label`}
					/>
					<S.OptionRemoveButton
						type="button"
						onClick={() => handleRemove(index)}
						aria-label={`Remove option ${index + 1}`}
					>
						<X size={14} />
					</S.OptionRemoveButton>
				</S.OptionRow>
			))}
			<S.AddButton type="button" onClick={handleAdd}>
				<Plus size={14} />
				Add option
			</S.AddButton>
			<S.FieldHint>Score is what gets saved; the label is what participants see.</S.FieldHint>
		</S.BoundFieldWrapper>
	);
};

export default RatingOptionsField;
