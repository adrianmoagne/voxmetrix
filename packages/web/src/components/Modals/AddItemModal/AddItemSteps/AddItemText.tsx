import { Box, Typography, Badge } from "@leux/ui";
import S from "../AddItemModal.styles";
import type { ItemPosition } from "@/@types";
import { addItemActions, type StoreState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { getItemPositionFromMap, getPositionsByGrid } from "@/utils";

const AddItemText: React.FC = () => {
	const dispatch = useDispatch();
	const { draft } = useSelector((state: StoreState) => state.addItem);
	const { gridType } = useSelector((state: StoreState) => state.createScreen);
	const position = draft?.position ? getItemPositionFromMap(draft.area!, draft.position) : null;
	const positionsItems = getPositionsByGrid(gridType);

	// const alignment =
	// 	draft?.v_align && draft?.h_align
	// 		? (`${draft.v_align}-${draft.h_align}` as ItemAlignment)
	// 		: null;

	// const handleAlignment = (align: ItemAlignment) => {
	// 	dispatch(addItemActions.setDraftFromAlignment(align));
	// };

	const handlePosition = (pos: ItemPosition) => {
		dispatch(addItemActions.setDraftFromPosition(pos));
	};

	const handleTextChange = (text: string) => {
		dispatch(addItemActions.setDraftText(text));
		dispatch(addItemActions.setDraftType("text"));
	};

	return (
		<>
			<Typography variant="body-2">Selected text type</Typography>
			<S.Row>
				<Badge>String</Badge>
				<Badge>HTML</Badge>
			</S.Row>

			<Typography variant="body-2">Select item position</Typography>
			<Box flex flexDirection="column" flexGap={6}>
				<S.Grid>
					{positionsItems.map((pos) => (
						<S.SelectableButton
							key={pos}
							onClick={() => handlePosition(pos)}
							$selected={position === pos}
						>
							{pos}
						</S.SelectableButton>
					))}
				</S.Grid>
			</Box>
			<Box
				flex
				flexDirection="column"
				flexGap={2}
				width={"100%"}
				height={"100%"}
				alignItems="flex-start"
			>
				<Typography variant="body-2">Text Editor</Typography>
				<S.TextEditor
					value={draft?.text ?? ""}
					placeholder="Type your text here"
					onChange={(e) => handleTextChange(e.target.value)}
				></S.TextEditor>
			</Box>
		</>
	);
};

export default AddItemText;
