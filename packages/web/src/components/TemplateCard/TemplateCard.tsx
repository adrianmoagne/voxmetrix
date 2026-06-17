import type { GridType, ItemPosition, ScreenItem } from "@/@types";
import { getPositionsByGrid, getPositionsMap } from "@/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Headphones, Image, AlignCenter, Eye } from "react-feather";
import S from "./TemplateCard.styles";
import { useTheme } from "@emotion/react";
export type TemplateType = "image" | "audio" | "text";
export interface TemplateScreen {
	_id: string;
	alias?: string;
	grid: {
		type: GridType; // "1x1", "2x2", "3x3"
		subtype?: string;
	};
	items: ScreenItem[];
	used_by?: string[];
	actions?: Record<string, unknown>;
	is_calibration?: boolean;
}

interface GridItem {
	position: ItemPosition;
	item?: ScreenItem;
}

type Props = {
	screen: TemplateScreen;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	width?: number;
	height?: number;
};

const TemplateCard: React.FC<Props> = ({ screen, onClick }) => {
	const [gridItems, setGridItems] = useState<GridItem[]>([]);
	const theme = useTheme();
	const findItemByPosition = (gridPosition: ItemPosition): ScreenItem | undefined => {
		const { area, position } = getPositionsMap(gridPosition);

		const foundItem = screen.items.find((item) => item.position === position && item.area === area);

		return foundItem;
	};

	const mapItemsPerPosition = useCallback(() => {
		const positions = getPositionsByGrid(screen.grid.type);

		const mappedItems: GridItem[] = positions.map((gridPosition) => {
			const foundItem = findItemByPosition(gridPosition);
			return {
				position: gridPosition,
				item: foundItem,
			};
		});

		setGridItems(mappedItems);
	}, [screen.grid.type, screen.items]);

	useEffect(() => {
		mapItemsPerPosition();
	}, [mapItemsPerPosition]);

	const gridStyles: React.CSSProperties = useMemo(() => {
		if (screen.grid.type === "1x1") {
			return {
				display: "flex",
				flexDirection: "row",
				justifyContent: "center",
				height: "100%",
			};
		}

		return {};
	}, [screen.grid.type]);

	const getTileStyles = (item?: ScreenItem): React.CSSProperties => {
		if (screen.grid.type !== "1x1") {
			return {};
		}

		if (!item) {
			return {
				display: "none",
			};
		}

		return {
			height: "48px",

			width: "66px",
		};
	};

	if (screen.is_calibration) {
		return (
			<S.Screen
				onClick={onClick}
				style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
			>
				<S.Tile style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
					<Eye size={32} color={theme.main.backgroundThree} />
				</S.Tile>
			</S.Screen>
		);
	}

	return (
		<S.Screen onClick={onClick} style={gridStyles}>
			{gridItems.map((gi) => (
				<S.Tile key={gi.position} hasItem={!!gi.item} style={getTileStyles(gi.item)}>
					{gi.item ? (
						gi.item.type === "template" ? (
							gi.item.template_type === "image" ? (
								<Image width={20} />
							) : gi.item.template_type === "audio" ? (
								<Headphones width={20} />
							) : gi.item.template_type === "text" ? (
								<AlignCenter width={20} />
							) : null
						) : gi.item.type === "text" ? (
							<AlignCenter width={20} />
						) : typeof gi.item.media !== "string" && gi.item.media ? (
							gi.item.media.type === "picture" ? (
								<img
									src={gi.item.media.src}
									style={{ width: "100%", height: "100%", objectFit: "cover" }}
								/>
							) : gi.item.media.type === "audio" ? (
								<Headphones width={20} />
							) : (
								<Image width={20} />
							)
						) : gi.item.template_type === "image" ? (
							<Image width={20} />
						) : gi.item.template_type === "audio" ? (
							<Headphones width={20} />
						) : gi.item.template_type === "text" ? (
							<AlignCenter width={20} />
						) : (
							<AlignCenter width={20} />
						)
					) : null}
				</S.Tile>
			))}
		</S.Screen>
	);
};

export default TemplateCard;
