import { Box, Button, useModal } from "@leux/ui";
import { ModalId, type ItemArea, type ScreenItemPosition, type ScreenItem } from "@/@types";
import type { StoreDispatch, StoreState } from "@/store";
import { addItemActions, createScreenActions } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import S from "./AddItemModal.styles";

const AddItemModalFooter: React.FC = () => {
	const dispatch = useDispatch<StoreDispatch>();
	const { draft } = useSelector((state: StoreState) => state.addItem);
	const { gridType } = useSelector((state: StoreState) => state.createScreen);
	const { closeModal } = useModal();

	const handleContinue = () => {
		if (!draft.type) return;
		let area: ItemArea | null = draft.area;
		let position: ScreenItemPosition | null = draft.position;
		if ((!area || !position) && gridType === "1x1") {
			area = "content";
			position = "center";
		}
		if (!area || !position) return;
		const v = draft.v_align ?? "center";
		const h = draft.h_align ?? "center";
		const item: ScreenItem = {
			_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
			type: draft.type,
			area,
			position,
			v_align: v,
			h_align: h,
			media: draft.media ?? undefined,
			form: draft.form ?? undefined,
			text: draft.text ?? undefined,
		};
		dispatch(createScreenActions.addItem(item));
		dispatch(addItemActions.clearDraft());
		dispatch(addItemActions.reset());
		closeModal(ModalId.AddItem);
	};
	const handleCancel = () => {
		dispatch(addItemActions.clearDraft());
		dispatch(addItemActions.reset());
		closeModal(ModalId.AddItem);
	};

	return (
		<S.FooterRow>
			<Box
				margins={{
					right: 10,
				}}
			>
				<Button onClick={handleCancel}>Back</Button>
			</Box>
			<Box>
				<Button colorScheme="primary" onClick={handleContinue}>
					Ok
				</Button>
			</Box>
		</S.FooterRow>
	);
};

export { AddItemModalFooter };
