import type { Placement, GridType, ItemArea, HAlign, VAlign } from "@/@types/screen.model";
import type { ItemPosition } from "@/@types";
import { getPositionsByGrid, getPositionsMap } from "@/utils/gridPositions";
import S from "./ScreenEntityEditor.styles";

const ALL_POSITIONS: ItemPosition[] = [
	"UL", "UC", "UR",
	"CL", "C", "CR",
	"BL", "BC", "BR",
];

interface PlacementEditorProps {
	placement: Placement;
	gridType: GridType;
	onChange: (update: Partial<Placement>) => void;
}

const PlacementEditor: React.FC<PlacementEditorProps> = ({
	placement,
	gridType,
	onChange,
}) => {
	const available = new Set(getPositionsByGrid(gridType));

	const currentPosition = placement.position;

	const handlePositionClick = (pos: ItemPosition) => {
		if (!available.has(pos)) return;
		const mapped = getPositionsMap(pos);
		onChange({
			area: mapped.area as ItemArea,
			position: pos,
		});
	};

	return (
		<S.PropertySection>
			<S.PropertyLabel>Placement</S.PropertyLabel>
			<div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
				<S.PositionGrid>
					{ALL_POSITIONS.map((pos) => (
						<S.PositionDot
							key={pos}
							$active={pos === currentPosition}
							$available={available.has(pos)}
							onClick={() => handlePositionClick(pos)}
							title={pos}
						/>
					))}
				</S.PositionGrid>
				<div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
					<div>
						<S.PropertyLabel>Order</S.PropertyLabel>
						<S.FieldInput
							type="number"
							value={placement.order}
							onChange={(e) => onChange({ order: Number(e.target.value) || 0 })}
							style={{ width: 60 }}
						/>
					</div>
					<div>
						<S.PropertyLabel>H-Align</S.PropertyLabel>
						<S.FieldSelect
							value={placement.hAlign ?? "center"}
							onChange={(e) => onChange({ hAlign: e.target.value as HAlign })}
						>
							<option value="left">Left</option>
							<option value="center">Center</option>
							<option value="right">Right</option>
						</S.FieldSelect>
					</div>
					<div>
						<S.PropertyLabel>V-Align</S.PropertyLabel>
						<S.FieldSelect
							value={placement.vAlign ?? "center"}
							onChange={(e) => onChange({ vAlign: e.target.value as VAlign })}
						>
							<option value="top">Top</option>
							<option value="center">Center</option>
							<option value="bottom">Bottom</option>
						</S.FieldSelect>
					</div>
				</div>
			</div>
		</S.PropertySection>
	);
};

export default PlacementEditor;
