import type { GridType, ItemPosition, Placement } from "@/@types/screen.model";

export const getGridSize = (type: GridType): number => {
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

export const getCellPosition = (placement: Placement, gridType: GridType) => {
	const gridSize = getGridSize(gridType);
	const row = Math.min(getRowFromArea(placement.area), gridSize);
	const col = Math.min(getColFromPosition(placement.position), gridSize);
	return { row, col, key: `${row}-${col}` };
};

/** Entities with the same key share a grid cell (and therefore its vertical alignment). */
export const getCellKey = (placement: Placement, gridType: GridType): string =>
	getCellPosition(placement, gridType).key;
