import { Badge, Typography, useModal, Grid, Box } from "@leux/ui";
import S from "./DisplayBuilder.styles";
import { Grid as FeatherGrid, ArrowLeft } from "react-feather";
import { ModalSizes, ModalId, type ItemPosition, type ItemAlignment, type IMedia, type IScreen, type ScreenItem } from "@/@types";
import { Modals } from "@/components";
import { useDispatch, useSelector } from "react-redux";
import { createScreenActions, type StoreDispatch, type StoreState } from "@/store";
import { getItemPositionFromMap } from "@/utils";
import { useTheme } from "@emotion/react";
type BoardScreen = {
	id: string;
	name: string;
	elements: number | null;
	displays?: IScreen | null;
};
interface DisplayBuilderProps {
	boardScreen: BoardScreen | null;
	onSave?: () => void;
}

const DisplayBuilder: React.FC<DisplayBuilderProps> = ({
	boardScreen,
	onSave: onSaveCallback
}) => {
	const theme = useTheme();
	const { createModal } = useModal();
	const dispatch = useDispatch<StoreDispatch>();
	const { gridType, items } = useSelector((state: StoreState) => state.createScreen);
	const { draft } = useSelector((state: StoreState) => state.addItem);
	const selectedMedia = draft?.media ?? null;
	const position = draft?.position ? getItemPositionFromMap(draft.area!, draft.position) : null;
	const alignment =
		draft?.v_align && draft?.h_align
			? (`${draft.v_align}-${draft.h_align}` as ItemAlignment)
			: null;

	const openGridSettings = () => {
		createModal({
			id: ModalId.GridSettings,
			title: "Grid",
			children: <Modals.GridSettingsModal.Content />,
			width: ModalSizes.GridSettings,
		});
	};

	const openAddItemModal = () => {
		createModal({
			id: ModalId.AddItem,
			title: "Add Item",
			children: <Modals.AddItemModal.Content />,
			customFooter: <Modals.AddItemModal.Footer />,
			width: ModalSizes.AddItem,
		});
	};

	const getGridSize = (size: string) => {
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

	const getGridIndex = (pos: ItemPosition): number => {
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

	const getAlignmentStyles = (align: ItemAlignment) => {
		const alignmentMap = {
			"top-left": { justifyContent: "flex-start", alignItems: "flex-start" },
			"top-center": { justifyContent: "center", alignItems: "flex-start" },
			"top-right": { justifyContent: "flex-end", alignItems: "flex-start" },
			"center-left": { justifyContent: "flex-start", alignItems: "center" },
			"center-center": { justifyContent: "center", alignItems: "center" },
			"center-right": { justifyContent: "flex-end", alignItems: "center" },
			"bottom-left": { justifyContent: "flex-start", alignItems: "flex-end" },
			"bottom-center": { justifyContent: "center", alignItems: "flex-end" },
			"bottom-right": { justifyContent: "flex-end", alignItems: "flex-end" },
		};
		return alignmentMap[align] || alignmentMap["center-center"];
	};

	const renderMedia = (media: IMedia | null) => {
		if (media && media.src) {


			if (media.type === "picture") {
				return (
					<img
						src={media.src}
						alt={media.filename}
						style={{
							maxWidth: "80%",
							maxHeight: "80%",
							objectFit: "contain",
							borderRadius: "4px",
						}}
					/>
				);
			}

			if (media.type === "audio") {
				return (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							maxWidth: "80%",
							maxHeight: "80%",
							padding: "8px",
							gap: "4px",
						}}
					>
						<audio
							controls
							style={{
								width: "100%",
								maxWidth: "150px",
								height: "30px",
							}}
						>
							<source src={media.src} />
							Your browser does not support audio.
						</audio>
						<div
							style={{
								fontSize: "9px",
								textAlign: "center",
								wordBreak: "break-word",
							}}
						>
							{media.filename}
						</div>
					</div>
				);
			}
		}

		return null;
	};

	const renderItemContent = (item: ScreenItem | null) => {
		if (!item) return null;

		if (item.type === "media" && item.media) {
			return renderMedia(item.media);
		}

		if (item.type === "text" && item.text) {
			return (
				<div style={{
					padding: "8px",
					textAlign: "center",
					wordBreak: "break-word",
					fontSize: "14px",
					color: "#333"
				}}>
					{item.text}
				</div>
			);
		}

		if (item.type === "form" && item.form) {
			return (
				<div style={{
					padding: "8px",
					textAlign: "center",
					wordBreak: "break-word",
					fontSize: "14px",
					color: theme.main.primary,
					border: `1px dashed ${theme.main.primary}`,
					borderRadius: "4px",
					backgroundColor: theme.main.primaryGhost,
				}}>
					Form: {typeof item.form === "string" ? item.form : item.form.alias}
				</div>
			);
		}

		return null;
	};



	const onSave = () => {
		if (boardScreen?.displays) {
			// Create a new array instead of mutating the existing one
			boardScreen.displays = {
				...boardScreen.displays,
				items: [...boardScreen.displays.items, ...items]
			};
		}
		dispatch(createScreenActions.reset());
		if (onSaveCallback) {
			onSaveCallback();
		}

	}
	return (
		<S.Container>

			<S.Frame>
				<S.Filters>
					<S.RowBetween>
						<Badge size="large" onClick={onSaveCallback}
							clickable variant="outlined" >
							<ArrowLeft size={16} />
							Back</Badge>

						<Typography textColor="primary" variant="body-1">
							Set alias
						</Typography>
					</S.RowBetween>
					<S.RowBetween>
						<Typography variant="button">
							<div
								onClick={() => openAddItemModal()}
								style={{
									textDecoration: "none",
									color: "inherit",
									cursor: "pointer",
								}}
							>
								add item
							</div>
						</Typography>
						<Badge onClick={openGridSettings} size="medium" clickable variant="outlined">
							<FeatherGrid size={16} color={theme.main.primary} />
							&nbsp;Grid
						</Badge>
						<Badge size="large" clickable variant="outlined">Actions</Badge>
						<Badge size="large" onClick={
							onSave
						} clickable variant="outlined">Save</Badge>
					</S.RowBetween>
				</S.Filters>
				<S.GridArea>
					<Grid
						cols={getGridSize(gridType)}
						rows={getGridSize(gridType)}
						gap={{ col: 5, row: 5 }}
						width="100%"
						padding="12px"
					>
						{Array.from({ length: getGridSize(gridType) ** 2 }).map((_, i) => {
							const hasMedia = selectedMedia && position && getGridIndex(position) === i;
							const savedItem = items.find(item => {
								// Get the position of this item
								const itemPosition = item.position ? getItemPositionFromMap(item.area!, item.position) : null;
								// Check if this item's position matches the current grid cell (i)
								return itemPosition && getGridIndex(itemPosition) === i;
							});
							// Check if saved item has media, text, or form
							const hasItemContent = savedItem && (savedItem.media || savedItem.text || savedItem.form);

							const alignmentStyles = alignment ? getAlignmentStyles(alignment) : {};
							// Get alignment for the saved item
							const savedItemAlignment = savedItem?.v_align && savedItem?.h_align
								? getAlignmentStyles(`${savedItem.v_align}-${savedItem.h_align}` as ItemAlignment)
								: {};

							return (
								<S.GridCell key={i}>
									<Box
										bgColor="default"
										textColor="darker"
										centered
										borderRadius="12px"
										height="100%"
									>
										<S.Item
											style={{
												...((hasMedia && alignmentStyles) || (hasItemContent && savedItemAlignment)),
											}}
										>
											{hasMedia && renderMedia(selectedMedia)}
											{hasItemContent && renderItemContent(savedItem)}
										</S.Item>
									</Box>
								</S.GridCell>
							);
						})}
					</Grid>
				</S.GridArea>
			</S.Frame>
		</S.Container>
	);
};

export default DisplayBuilder;
