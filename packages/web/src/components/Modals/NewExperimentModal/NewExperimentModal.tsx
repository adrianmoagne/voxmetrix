import { useState } from "react";
import S from "./NewExperimentModal.styles";
import { Button, Input, TextArea, Typography } from "@leux/ui";

export interface NewExperimentData {
	name: string;
	description: string;
}

interface ContentProps {
	onSubmit: (data: NewExperimentData) => void;
	onCancel?: () => void;
}

const Content: React.FC<ContentProps> = ({ onSubmit, onCancel }) => {
	const [name, setName] = useState<string>("");
	const [description, setDescription] = useState<string>("");

	const handleCreate = () => {
		if (!name.trim()) return;
		onSubmit({ name: name.trim(), description: description.trim() });
	};

	return (
		<S.Container>
			<S.FieldGroup>
				<Typography variant="body-2">Name</Typography>
				<Input
					placeholder="Experiment name"
					inputProps={{
						defaultValue: name,
						onChange: (e) => setName(e.target.value),
					}}
				/>
			</S.FieldGroup>

			<S.FieldGroup>
				<Typography variant="body-2">Description (optional)</Typography>
				<TextArea
					rows={3}
					placeholder="Describe your experiment..."
					onChange={(e) => setDescription(e.target.value)}
				/>
			</S.FieldGroup>

			<S.FooterRow>
				{onCancel && (
					<Button
						variant="ghost"
						colorScheme="secondary"
						customStyles={{ width: "100px" }}
						onClick={onCancel}
					>
						Cancel
					</Button>
				)}
				<Button
					colorScheme="primary"
					customStyles={{ width: "120px" }}
					onClick={handleCreate}
					state={{ disabled: !name.trim() }}
				>
					Create
				</Button>
			</S.FooterRow>
		</S.Container>
	);
};

const NewExperimentModal = {
	Content,
};

export default NewExperimentModal;
