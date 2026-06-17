import { Box, Typography, useModal, Grid } from "@leux/ui";
import S from "../AddItemModal.styles";
import { ModalId, ModalSizes, type ItemAlignment, type ItemPosition } from "@/@types";
import { addItemActions, type StoreState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import Modals from "../../Modals";
import { getPositionsByGrid, alignmentsItems, getItemPositionFromMap, getGridSize } from "@/utils";

const AddItemMedia: React.FC = () => {
	const dispatch = useDispatch();
	const { createModal } = useModal();
	const { draft } = useSelector((state: StoreState) => state.addItem);
	const { gridType } = useSelector((state: StoreState) => state.createScreen);
	const position = draft?.position ? getItemPositionFromMap(draft.area!, draft.position) : null;

	const alignment =
		draft?.v_align && draft?.h_align
			? (`${draft.v_align}-${draft.h_align}` as ItemAlignment)
			: null;
	const selectedMedia = draft?.media ?? null;
	const positionsItems = getPositionsByGrid(gridType);

	const openMediaGallery = () => {
		createModal({
			id: ModalId.MediaGallery,
			title: "Media Gallery",
			children: <Modals.MediaGalleryModal.Content />,
			width: ModalSizes.MediaGallery,
			customFooter: <Modals.MediaGalleryModal.Footer />,
			zIndex: 999999,
			maskClosable: false,
			centered: true,
			position: { top: "10%" },
		});
	};

	const handleAlignment = (align: ItemAlignment) => {
		dispatch(addItemActions.setDraftFromAlignment(align));
	};

	const handlePosition = (pos: ItemPosition) => {
		dispatch(addItemActions.setDraftFromPosition(pos));
	};

	return (
		<>
			<Typography variant="body-2">Selected Media</Typography>
			{selectedMedia ? (
				<S.ArtifictCard>
					<Typography variant="body-2">{selectedMedia.filename}</Typography>
				</S.ArtifictCard>
			) : (
				<S.DropZone
					onClick={() => {
						openMediaGallery();
					}}
				></S.DropZone>
			)}
			<Typography variant="body-2">Select item position</Typography>
			<Box flex flexDirection="column" flexGap={6}>
				<Grid
					cols={getGridSize(gridType)}
					rows={getGridSize(gridType)}
					gap={{ col: 5, row: 5 }}
					width="160px"
					customStyles={{
						height: "120px",
					}}
				>
					{positionsItems.map((pos) => (
						<S.SelectableButton
							key={pos}
							onClick={() => handlePosition(pos as ItemPosition)}
							$selected={position === pos}
						>
							{/* <S.SelectableButton key={pos} onClick={() => position === pos ? dispatch(addItemActions.setPosition(null as unknown as ItemPosition)) : handlePostionSelect(pos)} $selected={position === pos}> */}

							{pos}
						</S.SelectableButton>
					))}
				</Grid>
			</Box>
			<Box flex flexDirection="column" flexGap={6}>
				<Typography variant="body-2">Select item alignment</Typography>
				<Grid
					cols={getGridSize(gridType)}
					rows={getGridSize(gridType)}
					gap={{ col: 5, row: 5 }}
					width="160px"
					customStyles={{
						height: "120px",
					}}
				>
					{alignmentsItems.map((align) => (
						<S.SelectableButton
							key={align}
							onClick={() => handleAlignment(align)}
							$selected={alignment === align}
						></S.SelectableButton>
					))}
				</Grid>
			</Box>
		</>
	);
};

export default AddItemMedia;
