import { useState } from "react";
import {
	Button,
	Typography,
	Input,
	TextArea,
	Select,
	Radio,
	Checkbox,
} from "@leux/ui";
import { useTheme } from "@emotion/react";
import type {
	IScreen,
	ScreenItem,
	GridType,
	HAlign,
	VAlign,
	IFormInput,
	IForm,
} from "@/@types";
import { AudioPlayer } from "@/components";
import { renderInlineMarkdown } from "@/utils";

interface ScreenRendererProps {
	screen: IScreen;
	mode: "preview" | "runtime";
	onFormSubmit?: (data: Record<string, any>) => void;
	onFormBack?: () => void;
	containerStyle?: React.CSSProperties;
	enableTargetIds?: boolean;
}

const getGridSize = (type: GridType): number => {
	switch (type) {
		case "1x1":
			return 1;
		case "2x2":
			return 2;
		case "3x3":
			return 3;
		default:
			return 3;
	}
};

const getRowFromArea = (area: string): number => {
	switch (area) {
		case "heading":
			return 1;
		case "content":
			return 2;
		case "footer":
			return 3;
		default:
			return 2;
	}
};

const getColFromPosition = (position: string): number => {
	switch (position) {
		case "left":
			return 1;
		case "center":
			return 2;
		case "right":
			return 3;
		default:
			return 2;
	}
};

const getJustifyContent = (h: HAlign): string => {
	switch (h) {
		case "left":
			return "flex-start";
		case "right":
			return "flex-end";
		case "center":
		default:
			return "center";
	}
};

const getAlignItems = (v: VAlign): string => {
	switch (v) {
		case "top":
			return "flex-start";
		case "bottom":
			return "flex-end";
		case "center":
		default:
			return "center";
	}
};

const FormRenderer = ({
	form,
	onSubmit,
	onBack,
}: {
	form: IForm;
	onSubmit: (data: Record<string, any>) => void;
	onBack?: () => void;
}) => {
	const theme = useTheme();
	const [formData, setFormData] = useState<Record<string, string | boolean>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const choiceLabelStyle: React.CSSProperties = {
		color: theme.main.textTwo,
		cursor: "pointer",
		fontSize: "14px",
		fontWeight: 500,
		lineHeight: 1.4,
	};

	const renderLabelContent = (label: string, required?: boolean) => (
		<>
			{renderInlineMarkdown(label)}
			{required && <span style={{ color: "red" }}> *</span>}
		</>
	);

	const handleInputChange = (key: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[key];
				return newErrors;
			});
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};
		form.inputs?.forEach((input) => {
			if (input.required) {
				const value = formData[input.key];
				if (value === undefined || value === "" || value === false) {
					newErrors[input.key] = "This field is required";
				}
			}
		});
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (!validateForm()) return;
		onSubmit(formData);
	};

	const handleClear = () => {
		setFormData({});
		setErrors({});
	};

	const renderInput = (input: IFormInput) => {
		const hasError = !!errors[input.key];

		switch (input.type) {
			case "text":
				return (
					<div key={input.key} style={{ marginBottom: 16 }}>
						<Typography variant="body-2" textColor="textOne">
							{renderLabelContent(input.label, input.required)}
						</Typography>
						<Input
							placeholder={input.placeholder}
							inputProps={{
								value: (formData[input.key] as string) || "",
								onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
									handleInputChange(input.key, e.target.value),
							}}
						/>
						{hasError && (
							<Typography variant="caption" textColor="danger">
								{errors[input.key]}
							</Typography>
						)}
					</div>
				);

			case "textarea":
				return (
					<div key={input.key} style={{ marginBottom: 16 }}>
						<Typography variant="body-2" textColor="textOne">
							{renderLabelContent(input.label, input.required)}
						</Typography>
						<TextArea
							placeholder={input.placeholder}
							textAreaProps={{
								value: (formData[input.key] as string) || "",
								onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
									handleInputChange(input.key, e.target.value),
							}}
						/>
						{hasError && (
							<Typography variant="caption" textColor="danger">
								{errors[input.key]}
							</Typography>
						)}
					</div>
				);

			case "select":
				return (
					<div key={input.key} style={{ marginBottom: 16 }}>
						<Typography variant="body-2" textColor="textOne">
							{renderLabelContent(input.label, input.required)}
						</Typography>
						<Select
							placeholder={input.placeholder || "Select an option..."}
							options={
								input.options?.map((opt) => ({
									label: opt.label,
									value: opt.value,
								})) || []
							}
							onChange={(e: any) => handleInputChange(input.key, e.target.value)}
						/>
						{hasError && (
							<Typography variant="caption" textColor="danger">
								{errors[input.key]}
							</Typography>
						)}
					</div>
				);

			case "radio_group":
				return (
					<div key={input.key} style={{ marginBottom: 16 }}>
						<Typography variant="body-2" textColor="textOne">
							{renderLabelContent(input.label, input.required)}
						</Typography>
						<div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
							{input.options?.map((opt) => (
								<div
									key={opt.value}
									style={{ display: "flex", alignItems: "center", gap: 8 }}
								>
									<Radio
										fieldKey={input.key}
										value={opt.value}
										label=""
										defaultChecked={formData[input.key] === opt.value}
										onChange={() => handleInputChange(input.key, opt.value)}
										customLabelStyles={{ display: "none" }}
									/>
									<label htmlFor={`${input.key}#${opt.value}`} style={choiceLabelStyle}>
										{renderInlineMarkdown(opt.label)}
									</label>
								</div>
							))}
						</div>
						{hasError && (
							<Typography variant="caption" textColor="danger">
								{errors[input.key]}
							</Typography>
						)}
					</div>
				);

			case "checkbox":
				return (
					<div key={input.key} style={{ marginBottom: 16 }}>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<Checkbox
								fieldKey={input.key}
								label=""
								customLabelStyles={{ display: "none" }}
								checkBoxProps={{
									checked: !!formData[input.key],
									onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
										handleInputChange(input.key, e.target.checked),
								}}
							/>
							<label htmlFor={input.key} style={choiceLabelStyle}>
								{renderLabelContent(input.label, input.required)}
							</label>
						</div>
						{hasError && (
							<Typography variant="caption" textColor="danger">
								{errors[input.key]}
							</Typography>
						)}
					</div>
				);

			default:
				return null;
		}
	};

	const showBack = form.actions?.includes("back");
	const showClear = form.actions?.includes("clear");
	const showContinue = form.actions?.includes("continue");

	return (
		<div
			style={{
				padding: 8,
				display: "flex",
				flexDirection: "column",
				gap: 8,
				boxSizing: "border-box",
			}}
		>
			<div style={{ display: "flex", flexDirection: "column" }}>
				{form.inputs?.map((input) => renderInput(input))}
			</div>
			<div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
				{showBack && onBack && (
					<Button variant="outlined" onClick={onBack}>
						Back
					</Button>
				)}
				{showClear && (
					<Button variant="outlined" onClick={handleClear}>
						Clear
					</Button>
				)}
				{showContinue && (
					<Button colorScheme="primary" onClick={handleSubmit}>
						Continue
					</Button>
				)}
			</div>
		</div>
	);
};

const ScreenRenderer: React.FC<ScreenRendererProps> = ({
	screen,
	mode,
	onFormSubmit,
	onFormBack,
	containerStyle,
	enableTargetIds = false,
}) => {
	const theme = useTheme();
	const gridSize = getGridSize(screen.grid?.type || "3x3");

	// Build row template: form rows get auto height, others get 1fr
	const formRows = new Set(
		screen.items
			.filter((item) => item.type === "form")
			.map((item) => Math.min(getRowFromArea(item.area), gridSize))
	);
	const gridTemplateRows = Array.from({ length: gridSize }, (_, i) =>
		formRows.has(i + 1) ? "auto" : "1fr"
	).join(" ");

	const renderItemContent = (item: ScreenItem) => {
		const isMediaItem =
			item.type === "media" || item.template_type === "image" || item.template_type === "audio";
		const isTextItem = item.type === "text" || item.template_type === "text";

		if (isMediaItem && item.media && typeof item.media !== "string") {
			if (item.media.type === "picture" && item.media.src) {
				return (
					<img
						id={enableTargetIds ? `item-${item.media._id}` : undefined}
						src={item.media.src}
						alt={item.media.filename}
						style={{
							maxWidth: "100%",
							maxHeight: "100%",
							objectFit: "contain",
							borderRadius: "4px",
						}}
					/>
				);
			}
			if (item.media.type === "audio" && item.media.src) {
				if (mode === "runtime") {
					// Hide audio player in eye tracking mode; audio is played by ScreenTrial
					if (enableTargetIds) return null;
					return <AudioPlayer src={item.media.src} />;
				}
				// Preview mode: show native audio control like DisplayBuilder
				return (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							maxWidth: "80%",
							maxHeight: "80%",
							padding: "8px",
							gap: "4px",
						}}
					>
						<audio controls style={{ width: "100%", maxWidth: "150px", height: "30px" }}>
							<source src={item.media.src} />
							Your browser does not support audio.
						</audio>
						<div style={{ fontSize: "9px", textAlign: "center", wordBreak: "break-word" }}>
							{item.media.filename}
						</div>
					</div>
				);
			}
		}

		if (isTextItem && item.text) {
			return (
				<div
					style={{
						padding: "8px",
						textAlign: "center",
						wordBreak: "break-word",
						fontSize: "14px",
						color: "#333",
					}}
				>
					{item.text}
				</div>
			);
		}

		if (item.type === "form" && item.form) {
			if (mode === "runtime") {
				return (
					<FormRenderer
						form={item.form}
						onSubmit={onFormSubmit || (() => { })}
						onBack={onFormBack}
					/>
				);
			}
			return (
				<div
					style={{
						padding: "8px",
						textAlign: "center",
						wordBreak: "break-word",
						fontSize: "14px",
						color: theme.main.primary,
						border: `1px dashed ${theme.main.primary}`,
						borderRadius: "4px",
						backgroundColor: theme.main.primaryGhost,
					}}
				>
					Form: {typeof item.form === "string" ? item.form : item.form.alias}
				</div>
			);
		}

		return null;
	};

	const renderGridItem = (item: ScreenItem) => {
		const row = Math.min(getRowFromArea(item.area), gridSize);
		const col = Math.min(getColFromPosition(item.position), gridSize);

		return (
			<div
				key={item._id}
				style={{
					gridRow: row,
					gridColumn: col,
					display: "flex",
					justifyContent: getJustifyContent(item.h_align),
					alignItems: getAlignItems(item.v_align),
					boxSizing: "border-box",
					overflow: "hidden",
					minWidth: 0,
					minHeight: 0,
					width: "100%",
					height: "100%",
				}}
			>
				{renderItemContent(item)}
			</div>
		);
	};

	return (
		<div
			style={{
				display: "grid",
				gridTemplateRows,
				gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
				gap: "8px",
				padding: "8px",
				boxSizing: "border-box",
				width: "100%",
				height: "100%",
				...containerStyle,
			}}
		>
			{screen.items.map(renderGridItem)}
		</div>
	);
};

export default ScreenRenderer;
