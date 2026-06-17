import { useMemo } from "react";
import { Volume2, Image, Type, Star, Edit3, SkipForward } from "react-feather";
import { Grid, Box } from "@leux/ui";
import type { ScreenChildEntity, GridType } from "@/@types/screen.model";
import type { ItemPosition } from "@/@types";
import { buildGridCells } from "@/components/ScreenEntityRenderer/GridLayout";
import { getGridSize, getPositionsMap } from "@/utils/gridPositions";
import S from "./ScreenEntityEditor.styles";

const kindIcons: Record<
	ScreenChildEntity["kind"],
	React.FC<{ size?: number; color?: string }>
> = {
	AudioPlayer: Volume2,
	Image: Image,
	Text: Type,
	RatingScale: Star,
	TextHighlighter: Edit3,
	ContinueButton: SkipForward,
};

const cellPositionMap: Record<GridType, ItemPosition[]> = {
	"1x1": ["C"],
	"2x2": ["UL", "UR", "BL", "BR"],
	"3x3": ["UL", "UC", "UR", "CL", "C", "CR", "BL", "BC", "BR"],
};

interface EntityCanvasProps {
	gridType: GridType;
	children: ScreenChildEntity[];
	selectedUid: string | null;
	onSelectEntity: (uid: string | null) => void;
	onMoveEntity: (uid: string, position: ItemPosition) => void;
}

const EntityCanvas: React.FC<EntityCanvasProps> = ({
	gridType,
	children,
	selectedUid,
	onSelectEntity,
	onMoveEntity,
}) => {
	const gridSize = getGridSize(gridType);
	const cells = useMemo(() => buildGridCells(children, gridType), [children, gridType]);

	const cellMap = useMemo(() => {
		const map = new Map<string, typeof cells[number]>();  // cell: Array<Cell> -> cell[number]: Cell
		for (const cell of cells) {
			map.set(cell.key, cell);
		}
		return map;
	}, [cells]);

	return (
		<Grid
			cols={gridSize}
			rows={gridSize}
			gap={{ col: 5, row: 5 }}
			width="100%"
			padding="0"
			customStyles={{ height: "100%" }}
		>
			{Array.from({ length: gridSize ** 2 }).map((_, i) => {
				const positions = cellPositionMap[gridType];
				const pos = positions[i];
				const mapped = getPositionsMap(pos);
				const rowNum = mapped.area === "heading" ? 1 : mapped.area === "content" ? 2 : 3;
				const colNum = mapped.position === "left" ? 1 : mapped.position === "center" ? 2 : 3;
				const cellKey = `${rowNum}-${colNum}`;
				const cell = cellMap.get(cellKey);
				const cellChildren = cell?.children ?? [];
				const hasSelection = cellChildren.some((c) => c.uid === selectedUid);
				const isTargetable = cellChildren.length === 0 && !!selectedUid;

				const handleCellClick = () => {
					if (cellChildren.length > 0) {
						if (!hasSelection) {
							onSelectEntity(cellChildren[0].uid);
						}
					} else if (selectedUid) {
						onMoveEntity(selectedUid, pos);
					}
				};

				return (
					<S.GridCell key={i}>
						<Box bgColor="default" textColor="darker" borderRadius="12px" height="100%">
							<S.GridItem
								$selected={hasSelection}
								onClick={handleCellClick}
								style={{
									flexDirection: "column",
									justifyContent: "flex-start",
									alignItems: "stretch",
									padding: 6,
									position: "relative",
									cursor: isTargetable ? "copy" : cellChildren.length > 0 ? "pointer" : "default",
									outline: isTargetable ? "2px dashed #aaa" : undefined,
								}}
							>
								{cellChildren.length > 1 && (
									<S.StackIndicator>{cellChildren.length}</S.StackIndicator>
								)}
								{cellChildren.map((child) => {
									const Icon = kindIcons[child.kind];
									return (
										<S.EntityPreview
											key={child.uid}
											$selected={child.uid === selectedUid}
											$kind={child.kind}
											onClick={(e) => {
												e.stopPropagation();
												onSelectEntity(child.uid);
											}}
										>
											<Icon size={12} />
											<span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
												{child.name}
											</span>
										</S.EntityPreview>
									);
								})}
								{isTargetable && (
									<div style={{ opacity: 0.3, fontSize: 24, textAlign: "center" }}>+</div>
								)}
							</S.GridItem>
						</Box>
					</S.GridCell>
				);
			})}
		</Grid>
	);
};

export default EntityCanvas;
