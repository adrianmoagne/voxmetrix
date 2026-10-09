import type { GridType, ScreenChildEntity, Placement } from "@/@types/screen.model";
import { getCellPosition, getGridSize } from "./gridCells";

const getJustifyContent = (h?: string): string => {
	switch (h) {
		case "left":
			return "flex-start";
		case "right":
			return "flex-end";
		default:
			return "center";
	}
};

const getAlignItems = (v?: string): string => {
	switch (v) {
		case "top":
			return "flex-start";
		case "bottom":
			return "flex-end";
		default:
			return "center";
	}
};

const getGridTemplateRows = (gridSize: number): string =>
	`repeat(${gridSize}, minmax(min-content, 1fr))`;

const gridContainerStyle: React.CSSProperties = {
	display: "grid",
	boxSizing: "border-box",
	width: "100%",
	flex: 1,
	minHeight: 0,
	height: "100%",
	gap: "8px",
	padding: "8px",
};

export interface GridCell {
	key: string;
	row: number;
	col: number;
	children: ScreenChildEntity[];
	hAlign?: string;
	vAlign?: string;
}

export function buildGridCells(children: ScreenChildEntity[], gridType: GridType): GridCell[] {
	const cellMap = new Map<string, GridCell>();

	for (const child of children) {
		const { row, col, key } = getCellPosition(child.placement, gridType);

		if (!cellMap.has(key)) {
			cellMap.set(key, { key, row, col, children: [] });
		}
		const cell = cellMap.get(key)!;
		cell.children.push(child);
		// The cell takes the first alignment any of its entities sets.
		cell.hAlign ??= child.placement.hAlign;
		cell.vAlign ??= child.placement.vAlign;
	}

	// Sort children within each cell by order
	for (const cell of cellMap.values()) {
		cell.children.sort((a, b) => a.placement.order - b.placement.order);
	}

	return Array.from(cellMap.values());
}

/** Per-entity horizontal alignment and extra space; undefined when neither is set. */
const getChildWrapperStyle = (placement: Placement): React.CSSProperties | undefined => {
	const spaceBefore = placement.spaceBefore ?? 0;
	if (!placement.hAlign && spaceBefore <= 0) return undefined;
	return {
		alignSelf: placement.hAlign ? getJustifyContent(placement.hAlign) : undefined,
		marginTop: spaceBefore > 0 ? spaceBefore : undefined,
	};
};

interface GridLayoutProps {
	gridType: GridType;
	gridSubtype: string;
	cells: GridCell[];
	renderChild: (entity: ScreenChildEntity) => React.ReactNode;
}

const GridLayout: React.FC<GridLayoutProps> = ({ gridType, cells, renderChild }) => {
	const gridSize = getGridSize(gridType);

	return (
		<div
			style={{
				...gridContainerStyle,
				gridTemplateRows: getGridTemplateRows(gridSize),
				gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
			}}
		>
			{cells.map((cell) => (
				<div
					key={cell.key}
					style={{
						gridRow: cell.row,
						gridColumn: cell.col,
						display: "flex",
						flexDirection: "column",
						gap: "12px",
						justifyContent: getAlignItems(cell.vAlign),
						alignItems: getJustifyContent(cell.hAlign),
						boxSizing: "border-box",
						overflow: "visible",
						minWidth: 0,
						minHeight: 0,
						width: "100%",
						height: "100%",
					}}
				>
					{cell.children.map((child) => (
						<div key={child.uid} style={getChildWrapperStyle(child.placement)}>
							{renderChild(child)}
						</div>
					))}
				</div>
			))}
		</div>
	);
};

export default GridLayout;
