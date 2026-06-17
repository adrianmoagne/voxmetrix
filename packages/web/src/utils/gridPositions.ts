import type { GridType, ItemAlignment, ItemPosition } from "@/@types";

export interface BaseGridPosition {
	area: "heading" | "content" | "footer";
	position: "left" | "center" | "right";
	v_align: "top" | "center" | "bottom";
	h_align: "left" | "center" | "right";
}

interface Grid1x1 {
	type: "1x1";
	items: (BaseGridPosition & { position: "center" })[];
}

interface Grid2x2 {
	type: "2x2";
	items: (BaseGridPosition & { position: "left" | "right" })[];
}

interface Grid3x3 {
	type: "3x3";
	items: (BaseGridPosition & { position: "left" | "right" | "center" })[];
}

type Grid = Grid1x1 | Grid2x2 | Grid3x3;

export const getGridPositions = (grid: Grid) => {
	switch (grid.type) {
		case "1x1":
			return grid.items;
		case "2x2":
			return grid.items;
		case "3x3":
			return grid.items;
	}
};

export const getPositionsByGrid = (grid: GridType): ItemPosition[] => {
	switch (grid) {
		case "1x1":
			return ["UC", "C", "BC"];
		case "2x2":
			return ["UL", "UR", "BL", "BR"];
		case "3x3":
			return ["UL", "UC", "UR", "CL", "C", "CR", "BL", "BC", "BR"];
	}
};

export const getPositionsMap = (
	pos: ItemPosition
): { area: "heading" | "content" | "footer"; position: "left" | "center" | "right" } => {
	const map: Record<
		ItemPosition,
		{ area: "heading" | "content" | "footer"; position: "left" | "center" | "right" }
	> = {
		UL: { area: "heading", position: "left" },
		UC: { area: "heading", position: "center" },
		UR: { area: "heading", position: "right" },
		CL: { area: "content", position: "left" },
		C: { area: "content", position: "center" },
		CR: { area: "content", position: "right" },
		BL: { area: "footer", position: "left" },
		BC: { area: "footer", position: "center" },
		BR: { area: "footer", position: "right" },
	};
	return map[pos];
};

export const getItemPositionFromMap = (
	area: BaseGridPosition["area"],
	position: BaseGridPosition["position"]
): ItemPosition => {
	const reverseMap: Record<string, ItemPosition> = {
		"heading-left": "UL",
		"heading-center": "UC",
		"heading-right": "UR",
		"content-left": "CL",
		"content-center": "C",
		"content-right": "CR",
		"footer-left": "BL",
		"footer-center": "BC",
		"footer-right": "BR",
	};
	return reverseMap[`${area}-${position}`];
};

export const alignmentsItems: ItemAlignment[] = [
	"top-left",
	"top-center",
	"top-right",
	"center-left",
	"center-center",
	"center-right",
	"bottom-left",
	"bottom-center",
	"bottom-right",
];

export const getGridSize = (size: string) => {
	switch (size) {
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

export const getGridIndex = (pos: ItemPosition): number => {
	const positionMap: Record<ItemPosition, number> = {
		UL: 0,
		UC: 1,
		UR: 2, // Upper row
		CL: 3,
		C: 4,
		CR: 5, // Center row
		BL: 6,
		BC: 7,
		BR: 8, // Bottom row
	};
	return positionMap[pos];
};

export const getFlexAlignmentFromPosition = (
	pos: BaseGridPosition["area"]
): React.CSSProperties["alignSelf"] => {
	const alignmentMap: Record<BaseGridPosition["area"], React.CSSProperties["alignSelf"]> = {
		heading: "flex-start",
		content: "center",
		footer: "flex-end",
	};
	return alignmentMap[pos];
};

// const positionsByGrid = (g: GridType): ItemPosition[] =>
// 	g === "1x1"
// 		? ["C"]
// 		: g === "2x2"
// 		? ["UL", "UR", "BL", "BR"]
// 		: ["UL", "UC", "UR", "CL", "C", "CR", "BL", "BC", "BR"];
