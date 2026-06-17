import { Typography, Box, Badge } from "@leux/ui";
import S from "./AddItemModal.styles";
import { addItemActions, type StoreState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import AddItemSteps from "./AddItemSteps";
import { AddItemModalFooter } from "./AddItemModalFooter";

const Content: React.FC = () => {
	const dispatch = useDispatch();
	const { step } = useSelector((state: StoreState) => state.addItem);

	return (
		<S.Container>
			<Typography variant="body-2">Select type</Typography>
			<Box flex flexGap={12}>
				<Badge clickable onClick={() => dispatch(addItemActions.setStep("media"))}>
					Media
				</Badge>
				<Badge clickable onClick={() => dispatch(addItemActions.setStep("form"))}>
					Form
				</Badge>
				<Badge clickable onClick={() => dispatch(addItemActions.setStep("text"))}>
					Text
				</Badge>
			</Box>
			{step === "media" && <AddItemSteps.AddItemMedia />}
			{step === "form" && <AddItemSteps.AddItemForm />}
			{step === "text" && <AddItemSteps.AddItemText />}
		</S.Container>
	);
};

const AddItemModal = {
	Content,
	Footer: AddItemModalFooter,
};
export default AddItemModal;
