import type { ScreenChildEntity } from "@/@types/screen.model";
import { getShuffleSourceColumn, isShuffleableEntity } from "@/utils/stimulusShuffleUtils";
import S from "./ScreenEntityEditor.styles";

interface ShuffleStimuliFieldProps {
	entityUids: string[];
	screenChildren: ScreenChildEntity[];
	onChange: (entityUids: string[]) => void;
}

const ShuffleStimuliField: React.FC<ShuffleStimuliFieldProps> = ({
	entityUids,
	screenChildren,
	onChange,
}) => {
	const candidates = screenChildren.filter(isShuffleableEntity);
	const selected = new Set(entityUids);
	const shuffledCount = candidates.filter(
		(entity) => selected.has(entity.uid) && getShuffleSourceColumn(entity)
	).length;

	const toggle = (uid: string) => {
		onChange(selected.has(uid) ? entityUids.filter((id) => id !== uid) : [...entityUids, uid]);
	};

	return (
		<S.BoundFieldWrapper>
			<S.PropertyLabel>Entities to shuffle</S.PropertyLabel>
			{candidates.length === 0 && (
				<S.FieldHint>Add audio, image or text entities to this screen first.</S.FieldHint>
			)}
			{candidates.map((entity) => {
				const column = getShuffleSourceColumn(entity);
				return (
					<label
						key={entity.uid}
						style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
					>
						<input
							type="checkbox"
							checked={selected.has(entity.uid)}
							onChange={() => toggle(entity.uid)}
						/>
						<span style={{ fontSize: 12 }}>{entity.name}</span>
						<S.FieldHint>
							{column ? `→ ${column}` : "not bound to a column, can't be shuffled"}
						</S.FieldHint>
					</label>
				);
			})}
			<S.FieldHint>
				{shuffledCount < 2
					? "Tick at least two entities bound to spreadsheet columns."
					: `Each trial, these ${shuffledCount} entities randomly swap which column they show. Results record what each one showed.`}
			</S.FieldHint>
		</S.BoundFieldWrapper>
	);
};

export default ShuffleStimuliField;
