import type { GridType, ScreenChildEntity, ItemPosition } from "@/@types/screen.model";

const getGridSize = (type: GridType): number => {
	switch (type) {
		case "1x1":
			return 1;
		case "2x2":
			return 2;
		case "3x3":
			return 3;
		default:
			return 3;
	}
};

const getRowFromArea = (area: string): number => {
	switch (area) {
		case "heading":
			return 1;
		case "content":
			return 2;
		case "footer":
			return 3;
		default:
			return 2;
	}
};

const getColFromPosition = (position: ItemPosition): number => {
	if (position.endsWith("L") || position === "CL" || position === "UL" || position === "BL")
		return 1;
	if (position.endsWith("R") || position === "CR" || position === "UR" || position === "BR")
		return 3;
	return 2; // C, UC, BC
};

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
	const gridSize = getGridSize(gridType);
	const cellMap = new Map<string, GridCell>();

	for (const child of children) {
		const row = Math.min(getRowFromArea(child.placement.area), gridSize);
		const col = Math.min(getColFromPosition(child.placement.position), gridSize);
		const key = `${row}-${col}`;

		if (!cellMap.has(key)) {
			cellMap.set(key, {
				key,
				row,
				col,
				children: [],
				hAlign: child.placement.hAlign,
				vAlign: child.placement.vAlign,
			});
		}
		cellMap.get(key)!.children.push(child);
	}

	// Sort children within each cell by order
	for (const cell of cellMap.values()) {
		cell.children.sort((a, b) => a.placement.order - b.placement.order);
	}

	return Array.from(cellMap.values());
}

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
						<div key={child.uid}>{renderChild(child)}</div>
					))}
				</div>
			))}
		</div>
	);
};

export default GridLayout;
