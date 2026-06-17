import { Box, Typography, Input, Badge } from "@leux/ui";
import S from "../AddItemModal.styles";
import type { ItemAlignment, ItemPosition, IForm } from "@/@types";
import { addItemActions, formsActions, type StoreState, type StoreDispatch } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { Search } from "react-feather";
import { getItemPositionFromMap } from "@/utils";
import { useEffect, useState, useMemo } from "react";

const AddItemForm: React.FC = () => {
	const dispatch = useDispatch<StoreDispatch>();
	const { draft } = useSelector((state: StoreState) => state.addItem);
	const { forms, loading } = useSelector((state: StoreState) => state.forms);
	const [searchQuery, setSearchQuery] = useState("");

	const positionsItems: ItemPosition[] = ["UL", "UC", "UR", "CL", "C", "CR", "BL", "BC", "BR"];
	const position = draft?.position ? getItemPositionFromMap(draft.area!, draft.position) : null;
	const alignment =
		draft?.v_align && draft?.h_align
			? (`${draft.v_align}-${draft.h_align}` as ItemAlignment)
			: null;
	const alignmentsItems: ItemAlignment[] = [
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

	useEffect(() => {
		dispatch(formsActions.fetchForms());
	}, [dispatch]);

	const filteredForms = useMemo(() => {
		if (!forms) return [];
		const enabledForms = forms.filter((form) => form.status === "enabled");
		if (!searchQuery.trim()) return enabledForms;
		return enabledForms.filter((form) =>
			form.alias.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}, [forms, searchQuery]);

	const handleFormSelect = (form: IForm) => {
		dispatch(addItemActions.setDraftForm(form));
	};

	const handlePostionSelect = (pos: ItemPosition) => {
		dispatch(addItemActions.setDraftFromPosition(pos));
	};

	const handleAlignmentSelect = (align: ItemAlignment) => {
		dispatch(addItemActions.setDraftFromAlignment(align));
	};

	return (
		<>
			<Typography variant="body-2">Select a form</Typography>
			<S.Wrapper>
				<Input
					placeholder="Search forms..."
					inputProps={{
						value: searchQuery,
						onChange: (e) => setSearchQuery(e.target.value),
					}}
				/>
				<S.FloatingIcon>
					<Search size={16} />
				</S.FloatingIcon>
			</S.Wrapper>
			<S.FormsList>
				{loading ? (
					<Typography variant="caption" textColor="placeholder">
						Loading forms...
					</Typography>
				) : filteredForms.length === 0 ? (
					<Typography variant="caption" textColor="placeholder">
						{searchQuery ? "No forms found" : "No enabled forms available"}
					</Typography>
				) : (
					filteredForms.map((form) => (
						<S.FormCard
							key={form._id}
							$selected={draft.form?._id === form._id}
							onClick={() => handleFormSelect(form)}
						>
							<Typography variant="body-2" textColor="textOne">
								{form.alias}
							</Typography>
							<Box flex flexGap={6}>
								<Badge size="small" colorScheme="default" variant="ghost">
									{form.inputs?.length || 0} fields
								</Badge>
							</Box>
						</S.FormCard>
					))
				)}
			</S.FormsList>
			<Typography variant="body-2">Select item position</Typography>
			<Box flex flexDirection="column" flexGap={6}>
				<S.Grid>
					{positionsItems.map((pos) => (
						<S.SelectableButton
							key={pos}
							onClick={() => handlePostionSelect(pos)}
							$selected={position === pos}
						>
							{pos}
						</S.SelectableButton>
					))}
				</S.Grid>
			</Box>
			<Box flex flexDirection="column" flexGap={6}>
				<Typography variant="body-2">Select item alignment</Typography>
				<S.Grid>
					{alignmentsItems.map((align) => (
						<S.SelectableButton
							key={align}
							onClick={() => handleAlignmentSelect(align)}
							$selected={alignment === align}
						></S.SelectableButton>
					))}
				</S.Grid>
			</Box>
		</>
	);
};

export default AddItemForm;