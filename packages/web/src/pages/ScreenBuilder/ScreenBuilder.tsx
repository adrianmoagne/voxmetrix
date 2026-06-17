import { Badge, Typography, useModal, Grid, Box } from "@leux/ui";
import S from "./ScreenBuilder.styles";
import { Grid as FeatherGrid } from "react-feather";
import { ModalSizes, ModalId, type ItemPosition, type ItemAlignment, type IMedia } from "@/@types";
import { Modals } from "@/components";
import { useSelector } from "react-redux";
import { type StoreState } from "@/store";
import { getItemPositionFromMap } from "@/utils";

const ScreenBuilder: React.FC = () => {
	const { createModal } = useModal();
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
			const isPicture = media.type === "picture";
			const isAudio = media.type === "audio";

			if (isPicture) {
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

			if (isAudio) {
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

	const openSetupNewScreenModal = () => {
		createModal({
			id: ModalId.SetupNewScreen,
			title: "Setup New Screen",
			children: <Modals.SetupNewScreenModal.Content />,
			width: ModalSizes.SetupNewScreen,
			footer: null,
		});
	};

	return (
		<S.Container>
			<S.Header>
				<S.RowBetween>
					<Typography variant="h3" textColor="textOne">
						Experiment
					</Typography>
					<Badge size="large" variant="filled">
						exp-1
					</Badge>
				</S.RowBetween>
				<Typography variant="caption" textColor="placeholder">
					Create an experiment
				</Typography>
			</S.Header>
			<S.Frame>
				<S.Filters>
					<S.RowBetween>
						<Badge size="large">Back</Badge>
						<Badge size="large" onClick={openSetupNewScreenModal}>
							Create Screen
						</Badge>
						{/* <Typography>Create Screen</Typography> */}
						<Typography textColor="primary" variant="body-1">
							Set alias
						</Typography>
					</S.RowBetween>
					<S.RowBetween>
						<Typography variant="button">
							<a
								href="#"
								onClick={() => openAddItemModal()}
								style={{
									textDecoration: "none",
									color: "inherit",
									cursor: "pointer",
								}}
							>
								add item
							</a>
						</Typography>
						<Badge onClick={openGridSettings} size="small" clickable>
							<FeatherGrid size={16} />
							&nbsp;Grid
						</Badge>
						<Badge size="large">Actions</Badge>
						<Badge size="large">Save</Badge>
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
							const hasItem = items[i]?.media ?? null;
							const alignmentStyles = alignment ? getAlignmentStyles(alignment) : {};

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
												...(hasMedia && {
													...alignmentStyles,
												}),
											}}
										>
											{hasMedia && renderMedia(selectedMedia)}
											{hasItem && renderMedia(hasItem)}
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

export default ScreenBuilder;
