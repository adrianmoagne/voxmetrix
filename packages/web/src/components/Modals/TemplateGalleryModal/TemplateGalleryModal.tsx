// import { Typography } from "@leux/ui";
import { audioMockScreenTemplate, twoImagesScreenTemplate } from "@/@types";
import { templateViewerActions } from "@/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import S from "./TemplateGalleryModal.styles";

const Content: React.FC = () => {
	const dispatch = useDispatch();
	// const { templates, selectedTemplate } = useSelector((state: StoreState) => state.templateViewer);

	useEffect(() => {
		dispatch(
			templateViewerActions.setTemplates([twoImagesScreenTemplate, audioMockScreenTemplate])
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// const handleOnClick = (template: IScreen) => {
	// 	dispatch(templateViewerActions.setSelectedTemplate(template));
	// };

	return (
		<S.Container>
			{/* {!selectedTemplate ? (
				templates.map((template) => (
					<TemplateCard
						key={template._id}
						screen={template}
						onClick={() => handleOnClick(template)}
					/>
				))
			) : (
				<DynamicTable bo={selectedTemplate} />
			)} */}
		</S.Container>
	);
};

const TemplateGalleryModal = {
	Content,
};
export default TemplateGalleryModal;
