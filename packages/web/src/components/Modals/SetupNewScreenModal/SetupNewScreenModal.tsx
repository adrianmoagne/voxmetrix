import {
	ModalId,
	audioMockScreenTemplate,
	audioTextScreenTemplate,
	blankScreenTemplate,
	calibrationScreenTemplate,
	twoImagesScreenTemplate,
	type IScreen,
} from "@/@types";
import { setupNewScreenActions, templateViewerActions, type StoreState } from "@/store";
import { Button, Typography, useModal } from "@leux/ui";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import S from "./SetupNewScreenModal.styles";

type Props = {
	onCreate?: (payload: { template: IScreen }) => void;
	modalId?: string;
};

// All templates organized by category
const allTemplates: { category: string; templates: IScreen[] }[] = [
	{
		category: "Audio",
		templates: [audioMockScreenTemplate, audioTextScreenTemplate],
	},
	{
		category: "Eye Tracking",
		templates: [twoImagesScreenTemplate, calibrationScreenTemplate],
	},
	{
		category: "General",
		templates: [blankScreenTemplate],
	},
];

const flatTemplates = allTemplates.flatMap((g) => g.templates);

const Content: React.FC<Props> = ({ onCreate }) => {
	const { closeModal } = useModal();

	const dispatch = useDispatch();
	const { selectedType, selectedTemplate } = useSelector(
		(state: StoreState) => state.setupNewScreen
	);

	useEffect(() => {
		dispatch(setupNewScreenActions.reset());
		dispatch(templateViewerActions.setTemplates(flatTemplates));
	}, [dispatch]);

	const hasSelection =
		selectedType === "blank" || (selectedType === "template" && !!selectedTemplate);

	const handleCreate = () => {
		if (!hasSelection) {
			return;
		}
		const template = selectedType === "blank" ? blankScreenTemplate : selectedTemplate;
		if (template) {
			onCreate?.({ template });
		}
		closeModal(ModalId.SetupNewScreen, true);
	};

	return (
		<S.Container>
			<S.Options>
				{allTemplates.map((group) => (
					<React.Fragment key={group.category}>
						<Typography variant="caption" textColor="placeholder" customStyles={{ width: "100%", marginTop: "8px" }}>
							{group.category}
						</Typography>
						{group.templates.map((tpl) => (
							<S.OptionCard
								key={tpl._id}
								$selected={selectedType === "template" && selectedTemplate?._id === tpl._id}
								onClick={() => {
									dispatch(setupNewScreenActions.setSelectedTemplate(tpl));
								}}
							>
								<Typography textColor="textOne">{tpl.alias ?? "Template"}</Typography>
								<Typography variant="caption" textColor="placeholder">
									{tpl.description}
								</Typography>
							</S.OptionCard>
						))}
					</React.Fragment>
				))}
			</S.Options>

			<S.FooterRow>
				<Button
					colorScheme="primary"
					onClick={handleCreate}
					state={{ disabled: !hasSelection }}
					customStyles={{ width: "100%" }}
				>
					Create Screen
				</Button>
			</S.FooterRow>
		</S.Container>
	);
};

const SetupNewScreenModal = {
	Content,
};
export default SetupNewScreenModal;
