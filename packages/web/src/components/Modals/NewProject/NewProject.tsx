import { useState } from "react";
import S from "./NewProject.styles";
import { Button, Input, TextArea, Typography } from "@leux/ui";
import { useDispatch } from "react-redux";
import type { StoreDispatch } from "@/store";
import { projectActions } from "@/store";
const Content: React.FC = () => {
	const dispatch = useDispatch<StoreDispatch>();
	const [name, setName] = useState("Project");
	const [description, setDescription] = useState("");

	const handleCreate = () => {
		dispatch(projectActions.createProject({ alias: name, description }));
	};
	return (
		<S.Container>
			<Typography variant="body-2">Name</Typography>
			<Input
				placeholder="Project name"
				inputProps={{ defaultValue: name, onChange: (e) => setName(e.target.value) }}
			/>
			<Typography variant="body-2">Description</Typography>
			<TextArea
				rows={3}
				placeholder="About your project..."
				onChange={(e) => setDescription(e.target.value)}
			/>
			<S.FooterRow>
				<Button colorScheme="primary" customStyles={{ width: "100px" }} onClick={handleCreate}>
					Create
				</Button>
			</S.FooterRow>
		</S.Container>
	);
};

const NewProjectModal = {
	Content,
};

export default NewProjectModal;
