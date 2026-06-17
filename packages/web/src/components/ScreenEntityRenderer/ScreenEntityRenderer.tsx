import { useCallback, useMemo } from "react";
import type { ScreenEntity, SpreadsheetRow, ScreenCompletionData } from "@/@types/screen.model";
import type { AudioProgressState } from "@/utils/audioProgressUtils";
import { ScreenRuntimeProvider } from "./ScreenRuntimeContext";
import GridLayout, { buildGridCells } from "./GridLayout";
import ChildEntityRenderer from "./ChildEntityRenderer";
import BehaviorControllers from "./controllers/BehaviorControllers";
import ScreenOverlays from "./overlays/ScreenOverlays";

interface ScreenEntityRendererProps {
	screen: ScreenEntity;
	row?: SpreadsheetRow;
	onComplete: (data: ScreenCompletionData) => void;
	audioProgress?: AudioProgressState | null;
}

const ScreenEntityRenderer: React.FC<ScreenEntityRendererProps> = ({
	screen,
	row,
	onComplete,
	audioProgress,
}) => {
	const behaviors = screen.behaviors ?? [];

	const cells = useMemo(
		() => buildGridCells(screen.children, screen.props.grid.type),
		[screen.children, screen.props.grid.type]
	);

	const renderChild = useCallback(
		(entity: (typeof screen.children)[number]) => (
			<ChildEntityRenderer entity={entity} row={row} />
		),
		[row]
	);

	const stageStyle: React.CSSProperties = {
		width: "100%",
		flex: 1,
		minHeight: 0,
		display: "flex",
		flexDirection: "column",
	};

	return (
		<div style={{ width: "100%", minHeight: "100%", display: "flex", flexDirection: "column" }}>
			<ScreenRuntimeProvider
				key={`${screen.uid}-${row?.uid ?? ""}`}
				screenUid={screen.uid}
				rowUid={row?.uid}
				children={screen.children}
				behaviors={behaviors}
				onComplete={onComplete}
				reactChildren={
					<div style={{ ...stageStyle, position: "relative" }}>
						<BehaviorControllers
							behaviors={behaviors}
							children={screen.children}
							row={row}
						/>

						<GridLayout
							gridType={screen.props.grid.type}
							gridSubtype={screen.props.grid.subtype}
							cells={cells}
							renderChild={renderChild}
						/>

						<ScreenOverlays behaviors={behaviors} row={row} audioProgress={audioProgress} />
					</div>
				}
			/>
		</div>
	);
};

export default ScreenEntityRenderer;
