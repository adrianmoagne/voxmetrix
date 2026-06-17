import { Button, Input, Select, TextArea, Typography, Checkbox } from "@leux/ui";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import S from "./FormBuilder.styles";
import { Pages, type IFormInput, type IFormInputType, type IFormAction } from "@/@types";
import type { StoreDispatch, StoreState } from "@/store";
import { formsActions } from "@/store/Slices/Forms.slice";
import { renderInlineMarkdown } from "@/utils";
import {
	ArrowLeft,
	Type,
	AlignLeft,
	List,
	Circle,
	CheckSquare,
	Trash2,
	MoreVertical,
	Plus,
	Play,
	Save,
} from "react-feather";

const FIELD_TYPES: { type: IFormInputType; label: string; icon: React.ReactNode }[] = [
	{ type: "text", label: "Text Input", icon: <Type size={18} /> },
	{ type: "textarea", label: "Text Area", icon: <AlignLeft size={18} /> },
	{ type: "select", label: "Dropdown", icon: <List size={18} /> },
	{ type: "radio_group", label: "Radio Group", icon: <Circle size={18} /> },
	{ type: "checkbox", label: "Checkbox", icon: <CheckSquare size={18} /> },
];

const generateKey = () => `field_${Date.now()}`;

const FormBuilder: React.FC = () => {
	const dispatch = useDispatch<StoreDispatch>();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const { currentForm, saving } = useSelector((state: StoreState) => state.forms);

	const [alias, setAlias] = useState("");
	const [inputs, setInputs] = useState<IFormInput[]>([]);
	const [actions, setActions] = useState<IFormAction[]>(["back", "continue"]);
	const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
	const [showPreview, setShowPreview] = useState(false);

	const isEditMode = !!id;

	useEffect(() => {
		if (isEditMode && id) {
			dispatch(formsActions.fetchFormById(id));
		}
	}, [dispatch, id, isEditMode]);

	useEffect(() => {
		if (currentForm && isEditMode) {
			setAlias(currentForm.alias);
			setInputs(currentForm.inputs || []);
			setActions(currentForm.actions || ["back", "continue"]);
		}
	}, [currentForm, isEditMode]);

	useEffect(() => {
		return () => {
			dispatch(formsActions.clearCurrentForm());
		};
	}, [dispatch]);

	const handleBack = () => {
		navigate(Pages.Forms);
	};

	const handleAddField = (type: IFormInputType) => {
		const newField: IFormInput = {
			type,
			label: `New ${type.replace("_", " ")} field`,
			key: generateKey(),
			placeholder: "",
			required: false,
			options: type === "select" || type === "radio_group" ? [{ label: "Option 1", value: "option1" }] : undefined,
		};
		setInputs([...inputs, newField]);
		setSelectedFieldIndex(inputs.length);
	};

	const handleUpdateField = (index: number, updates: Partial<IFormInput>) => {
		const updatedInputs = [...inputs];
		updatedInputs[index] = { ...updatedInputs[index], ...updates };
		setInputs(updatedInputs);
	};

	const handleDeleteField = (index: number) => {
		const updatedInputs = inputs.filter((_, i) => i !== index);
		setInputs(updatedInputs);
		setSelectedFieldIndex(null);
	};

	const handleAddOption = (fieldIndex: number) => {
		const field = inputs[fieldIndex];
		if (field.options) {
			const newOptions = [...field.options, { label: `Option ${field.options.length + 1}`, value: `option${field.options.length + 1}` }];
			handleUpdateField(fieldIndex, { options: newOptions });
		}
	};

	const handleUpdateOption = (fieldIndex: number, optionIndex: number, updates: { label?: string; value?: string }) => {
		const field = inputs[fieldIndex];
		if (field.options) {
			const newOptions = [...field.options];
			newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
			handleUpdateField(fieldIndex, { options: newOptions });
		}
	};

	const handleDeleteOption = (fieldIndex: number, optionIndex: number) => {
		const field = inputs[fieldIndex];
		if (field.options && field.options.length > 1) {
			const newOptions = field.options.filter((_, i) => i !== optionIndex);
			handleUpdateField(fieldIndex, { options: newOptions });
		}
	};

	const handleSave = async () => {
		if (!alias.trim()) {
			alert("Please enter a form alias");
			return;
		}

		const formData = {
			alias,
			actions,
			inputs,
		};

		if (isEditMode && id) {
			await dispatch(formsActions.updateForm({ formId: id, payload: formData }));
		} else {
			await dispatch(formsActions.createForm(formData));
		}
		navigate(Pages.Forms);
	};

	const selectedField = selectedFieldIndex !== null ? inputs[selectedFieldIndex] : null;

	const renderFieldPreview = (field: IFormInput, index: number) => {
		const isSelected = selectedFieldIndex === index;
		const previewCheckboxId = `preview-${field.key}`;

		return (
			<S.FormFieldWrapper
				key={field.key}
				isSelected={isSelected}
				onClick={() => setSelectedFieldIndex(index)}
			>
				<S.FieldActions className="field-actions">
					<Button
						variant="ghost"
						size="small"
						colorScheme="danger"
						onClick={(e?: React.MouseEvent) => {
							e?.stopPropagation();
							handleDeleteField(index);
						}}
					>
						<Trash2 size={14} />
					</Button>
					<MoreVertical size={14} style={{ cursor: "grab", opacity: 0.5 }} />
				</S.FieldActions>

				<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
					{field.type !== "checkbox" && (
						<Typography variant="body-2" textColor="textOne">
							{renderInlineMarkdown(field.label)}
							{field.required && <span style={{ color: "red" }}> *</span>}
						</Typography>
					)}

					{field.type === "text" && (
						<Input
							placeholder={field.placeholder || "Enter text..."}
							inputProps={{ disabled: true }}
						/>
					)}

					{field.type === "textarea" && (
						<TextArea
							placeholder={field.placeholder || "Enter text..."}
							state={{ disabled: true }}
						/>
					)}

					{field.type === "select" && (
						<Select
							options={field.options?.map((opt) => ({ label: opt.label, value: opt.value })) || []}
							placeholder={field.placeholder || "Select an option..."}
							state={{ disabled: true }}
						/>
					)}

					{field.type === "radio_group" && (
						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							{field.options?.map((opt, i) => (
								<label key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<input type="radio" name={field.key} disabled />
									<Typography variant="body-2">{renderInlineMarkdown(opt.label)}</Typography>
								</label>
							))}
						</div>
					)}

					{field.type === "checkbox" && (
						<label
							htmlFor={previewCheckboxId}
							style={{ display: "flex", alignItems: "center", gap: 8, cursor: "not-allowed" }}
						>
							<input id={previewCheckboxId} type="checkbox" disabled />
							<Typography variant="body-2" textColor="textOne">
								{renderInlineMarkdown(field.label)}
								{field.required && <span style={{ color: "red" }}> *</span>}
							</Typography>
						</label>
					)}
				</div>
			</S.FormFieldWrapper>
		);
	};

	return (
		<S.Container>
			<S.Header>
				<S.HeaderRow>
					<S.HeaderLeft>
						<Button variant="ghost" onClick={handleBack}>
							<ArrowLeft size={18} />
						</Button>
						<Typography variant="h4" textColor="textOne">
							{isEditMode ? "Edit Form" : "Form Builder"}
						</Typography>
					</S.HeaderLeft>
					<S.HeaderRight>
						<S.AliasInput>
							<Typography variant="caption" textColor="placeholder">
								Alias:
							</Typography>
							<input
								type="text"
								value={alias}
								onChange={(e) => setAlias(e.target.value)}
								placeholder="form_alias"
							/>
						</S.AliasInput>
						<Button
							variant="outlined"
							onClick={() => setShowPreview(!showPreview)}
						>
							<Play size={16} />
							{showPreview ? "Edit" : "Preview"}
						</Button>
						<Button colorScheme="primary" onClick={handleSave} state={{ disabled: saving }}>
							<Save size={16} />
							{saving ? "Saving..." : "Save"}
						</Button>
					</S.HeaderRight>
				</S.HeaderRow>
				<Typography variant="caption" textColor="placeholder">
					{isEditMode ? "Edit your form fields and settings" : "Create a new form by adding fields"}
				</Typography>
			</S.Header>

			<S.Content>
				{!showPreview && (
					<S.BuilderPanel>
						<S.BuilderSection>
							<S.SectionTitle>Add Fields</S.SectionTitle>
							{FIELD_TYPES.map(({ type, label, icon }) => (
								<S.FieldTypeButton key={type} onClick={() => handleAddField(type)}>
									{icon}
									<span>{label}</span>
								</S.FieldTypeButton>
							))}
						</S.BuilderSection>

						<S.BuilderSection>
							<S.SectionTitle>Form Actions</S.SectionTitle>
							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								<Checkbox
									fieldKey="action-back"
									label="Show Back Button"
									checkBoxProps={{
										defaultChecked: undefined,
										checked: actions.includes("back"),
										onChange: (e) => {
											if (e.target.checked) {
												setActions([...actions, "back"]);
											} else {
												setActions(actions.filter((a) => a !== "back"));
											}
										},
									}}
								/>
								<Checkbox
									fieldKey="action-clear"
									label="Show Clear Button"
									checkBoxProps={{
										defaultChecked: undefined,
										checked: actions.includes("clear"),
										onChange: (e) => {
											if (e.target.checked) {
												setActions([...actions, "clear"]);
											} else {
												setActions(actions.filter((a) => a !== "clear"));
											}
										},
									}}
								/>
								<Checkbox
									fieldKey="action-continue"
									label="Show Continue Button"
									checkBoxProps={{
										defaultChecked: undefined,
										checked: actions.includes("continue"),
										onChange: (e) => {
											if (e.target.checked) {
												setActions([...actions, "continue"]);
											} else {
												setActions(actions.filter((a) => a !== "continue"));
											}
										},
									}}
								/>
							</div>
						</S.BuilderSection>
					</S.BuilderPanel>
				)}

				<S.PreviewPanel>
					<S.PreviewHeader>
						<Typography variant="h5" textColor="textOne">
							{showPreview ? "Form Preview" : "Form Fields"}
						</Typography>
						<Typography variant="caption" textColor="placeholder">
							{inputs.length} field{inputs.length !== 1 ? "s" : ""}
						</Typography>
					</S.PreviewHeader>

					{inputs.length === 0 ? (
						<S.EmptyState>
							<Typography variant="body-1" textColor="placeholder">
								No fields added yet
							</Typography>
							<Typography variant="caption" textColor="placeholder">
								Click on a field type from the left panel to add it to your form
							</Typography>
						</S.EmptyState>
					) : (
						<S.FormFields>
							{inputs.map((field, index) => renderFieldPreview(field, index))}
						</S.FormFields>
					)}

					{inputs.length > 0 && (
						<S.FormActionsPanel>
							{actions.includes("back") && (
								<Button variant="outlined">Back</Button>
							)}
							{actions.includes("clear") && (
								<Button variant="outlined">Clear</Button>
							)}
							{actions.includes("continue") && (
								<Button colorScheme="primary">Continue</Button>
							)}
						</S.FormActionsPanel>
					)}
				</S.PreviewPanel>

				{!showPreview && selectedField && (
					<S.SettingsPanel>
						<S.SettingsSection>
							<S.SectionTitle>Field Settings</S.SectionTitle>

							<S.SettingsField>
								<Typography variant="caption" textColor="placeholder">
									Label
								</Typography>
								<Input
									inputProps={{
										value: selectedField.label,
										onChange: (e) =>
											handleUpdateField(selectedFieldIndex!, { label: e.target.value }),
										}}
									/>
									<Typography variant="caption" textColor="placeholder">
										Use **bold** and *italic* for inline formatting.
									</Typography>
							</S.SettingsField>

							<S.SettingsField>
								<Typography variant="caption" textColor="placeholder">
									Key (unique identifier)
								</Typography>
								<Input
									inputProps={{
										value: selectedField.key,
										onChange: (e) =>
											handleUpdateField(selectedFieldIndex!, { key: e.target.value }),
									}}
								/>
							</S.SettingsField>

							{(selectedField.type === "text" ||
								selectedField.type === "textarea" ||
								selectedField.type === "checkbox") && (
									<S.SettingsField>
										<Typography variant="caption" textColor="placeholder">
											Placeholder
										</Typography>
										<Input
											inputProps={{
												value: selectedField.placeholder || "",
												onChange: (e) =>
													handleUpdateField(selectedFieldIndex!, {
														placeholder: e.target.value,
													}),
											}}
										/>
									</S.SettingsField>
								)}

							<S.SettingsField>
								<Checkbox
									fieldKey="field-required"
									label="Required field"
									checkBoxProps={{
										defaultChecked: undefined,
										checked: selectedField.required || false,
										onChange: (e) =>
											handleUpdateField(selectedFieldIndex!, { required: e.target.checked }),
									}}
								/>
							</S.SettingsField>
						</S.SettingsSection>

						{(selectedField.type === "select" || selectedField.type === "radio_group") && (
							<S.SettingsSection>
								<S.SectionTitle>Options</S.SectionTitle>
								<Typography variant="caption" textColor="placeholder">
									{selectedField.type === "radio_group"
										? "Radio option labels support **bold** and *italic*."
										: "Dropdown option labels stay plain text in v1."}
								</Typography>
								<S.OptionsContainer>
									{selectedField.options?.map((option, optIndex) => (
										<S.OptionRow key={optIndex}>
											<Input
												inputProps={{
													value: option.label,
													onChange: (e) =>
														handleUpdateOption(selectedFieldIndex!, optIndex, {
															label: e.target.value,
														}),
													placeholder: "Label",
												}}
											/>
											<Input
												inputProps={{
													value: option.value,
													onChange: (e) =>
														handleUpdateOption(selectedFieldIndex!, optIndex, {
															value: e.target.value,
														}),
													placeholder: "Value",
												}}
											/>
											<Button
												variant="ghost"
												size="small"
												colorScheme="danger"
												onClick={() => handleDeleteOption(selectedFieldIndex!, optIndex)}
												state={{ disabled: selectedField.options?.length === 1 }}
											>
												<Trash2 size={14} />
											</Button>
										</S.OptionRow>
									))}
								</S.OptionsContainer>
								<Button
									variant="outlined"
									size="small"
									onClick={() => handleAddOption(selectedFieldIndex!)}
								>
									<Plus size={14} />
									Add Option
								</Button>
							</S.SettingsSection>
						)}
					</S.SettingsPanel>
				)}
			</S.Content>
		</S.Container>
	);
};

export default FormBuilder;
