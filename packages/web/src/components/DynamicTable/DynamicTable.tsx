import { Table, Input } from "@leux/ui";
import type { IScreen, TemplateType } from "@/@types";
import S from "./DynamicTable.styles";
import { useMemo } from "react";
import { ArrowUp, ArrowDown, Trash2 } from "react-feather";
import { useTheme } from "@emotion/react";

type BoardScreen = {
	id: string;
	name: string;
	elements: number | null;
	displays?: IScreen | null;
};

type Props = {
	boardScreens: BoardScreen[];
	onReorderScreens?: (ordered: BoardScreen[]) => void;
	onUpdateScreenItem?: (boardScreenId: string, itemId: string, value: string) => void;
	onDeleteScreen?: (screenId: string) => void;
	screenValues?: Record<string, Record<string, string>>; // boardScreenId -> itemId -> value
	collapseBorder?: boolean;
};

// Generate column key from item properties - pattern: "{template_type|type}_{area}_{position}"
const getColumnKey = (item: { template_type?: string; type?: string; area: string; position: string }) => {
	return `${item.template_type || item.type}_${item.area}_${item.position}`;
};

const DynamicTable: React.FC<Props> = ({
	boardScreens,
	onReorderScreens,
	onUpdateScreenItem,
	onDeleteScreen,
	screenValues = {},
	collapseBorder = false,
}) => {
	const theme = useTheme();
	const columns = useMemo(() => {
		const seenColumnKeys = new Set<string>();
		const allColumns: Array<{
			key: string;
			type: TemplateType;
			label: string;
			columnKey: string; // template_type_area_position pattern
		}> = [];
		const typeCounters: Record<TemplateType, number> = {
			image: 0,
			audio: 0,
			text: 0,
		};

		boardScreens.forEach((boardScreen) => {
			if (!boardScreen.displays) return;

			boardScreen.displays.items.forEach((item) => {
				// Use template_type if available, otherwise fall back to type
				const itemType = (item.template_type || item.type) as TemplateType | undefined;
				if (!itemType) return;

				const columnKey = getColumnKey(item);

				// Only add column if we haven't seen this column key before
				if (seenColumnKeys.has(columnKey)) {
					return;
				}
				seenColumnKeys.add(columnKey);

				// Track type counter (default to 0 if type not in counters)
				if (typeCounters[itemType] !== undefined) {
					typeCounters[itemType] += 1;
				}
				allColumns.push({
					key: columnKey,
					type: itemType,
					label: `${itemType} ${typeCounters[itemType] || 1}`,
					columnKey: columnKey,
				});
			});
		});

		return allColumns;
	}, [boardScreens]);

	const moveBoardScreen = (index: number, delta: number) => {
		if (!onReorderScreens) return;
		const target = index + delta;
		if (target < 0 || target >= boardScreens.length) return;
		const next = [...boardScreens];
		[next[index], next[target]] = [next[target], next[index]];
		onReorderScreens(next);
	};

	const wrapperStyles: React.CSSProperties = {
		...(collapseBorder ? { borderRadius: 0, border: "none" } : {}),
		flex: 1,
		minHeight: 0,
		overflow: "auto",
	};

	return (
		<S.Container>
			<Table.Root variant="bordered" height="auto" customWrapperStyles={wrapperStyles}>
				<Table.Header>
					<Table.HeaderRow>
						<Table.HeaderColumn>Order</Table.HeaderColumn>
						<Table.HeaderColumn>#</Table.HeaderColumn>
						<Table.HeaderColumn>display</Table.HeaderColumn>
						{columns.map((column) => (
							<Table.HeaderColumn key={column.key}>{column.label}</Table.HeaderColumn>
						))}
						{onDeleteScreen && <Table.HeaderColumn>{" "}</Table.HeaderColumn>}
					</Table.HeaderRow>
				</Table.Header>
				<Table.Body>
					{boardScreens.map((boardScreen, idx) => (
						<Table.BodyRow key={boardScreen.id}>
							<Table.BodyCell>
								<S.Actions>
									<S.ActionIcon disabled={idx === 0}>
										<ArrowUp size={16} onClick={() => moveBoardScreen(idx, -1)} />
									</S.ActionIcon>
									<S.ActionIcon disabled={idx === boardScreens.length - 1}>
										<ArrowDown size={16} onClick={() => moveBoardScreen(idx, 1)} />
									</S.ActionIcon>
								</S.Actions>
							</Table.BodyCell>
							<Table.BodyCell>{idx + 1}</Table.BodyCell>
							<Table.BodyCell>{boardScreen.name}</Table.BodyCell>
							{columns.map((column) => {
								// Find if this boardScreen has an item matching this column's key pattern
								const matchingItem = boardScreen.displays?.items.find(
									item => getColumnKey(item) === column.columnKey
								);

								const itemId = matchingItem?._id;
								const defaultValue = itemId ? (screenValues[boardScreen.id]?.[itemId] || "") : "";

								return (
									<Table.BodyCell key={column.key}>
										{matchingItem && itemId ? (
											<Input
												variant="filled"
												fieldKey={`${boardScreen.id}_${itemId}`}
												inputProps={{
													defaultValue: defaultValue,
													onBlur: (e) => {
														const target = e.target as HTMLInputElement;
														onUpdateScreenItem?.(boardScreen.id, itemId, target.value);
													},
												}}
											/>
										) : "---"}
									</Table.BodyCell>
								);
							})}
							{onDeleteScreen && (
								<Table.BodyCell>
									<S.ActionIcon onClick={() => onDeleteScreen(boardScreen.id)}>
										<Trash2 size={16} color={theme.main.danger} />
									</S.ActionIcon>
								</Table.BodyCell>
							)}
						</Table.BodyRow>
					))}
				</Table.Body>
			</Table.Root>
		</S.Container>
	);
};

export default DynamicTable;
