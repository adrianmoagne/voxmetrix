import { useEffect, useState } from "react";
import type { Bound, BindingRef } from "@/@types/screen.model";
import S from "./ScreenEntityEditor.styles";

function isBinding<T>(value: Bound<T>): value is BindingRef<T> {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as BindingRef<T>).kind === "binding"
	);
}

type FieldType = "string" | "number" | "boolean" | "select" | "string[]";

const parseValueByType = (raw: string, type: FieldType): unknown => {
	if (raw === "") return undefined;

	switch (type) {
		case "number":
			return Number(raw);
		case "boolean":
			return raw === "true";
		case "string[]":
			return raw
				.split(",")
				.map((part) => part.trim())
				.filter(Boolean);
		default:
			return raw;
	}
};

const formatValueByType = (value: unknown, type: FieldType): string => {
	if (value === undefined || value === null) return "";

	switch (type) {
		case "string[]":
			return Array.isArray(value) ? value.join(", ") : "";
		case "boolean":
			return value ? "true" : "false";
		default:
			return String(value);
	}
};

interface BoundFieldProps {
	label: string;
	value: Bound<unknown>;
	onChange: (value: Bound<unknown>) => void;
	type?: FieldType;
	options?: { label: string; value: string }[];
	placeholder?: string;
}

const BoundField: React.FC<BoundFieldProps> = ({
	label,
	value,
	onChange,
	type = "string",
	options,
	placeholder,
}) => {
	const bound = isBinding(value);
	const binding = bound ? (value as BindingRef<unknown>) : null;
	const [directStringArrayInput, setDirectStringArrayInput] = useState("");
	const [bindingStringArrayInput, setBindingStringArrayInput] = useState("");

	useEffect(() => {
		if (!bound && type === "string[]") {
			setDirectStringArrayInput(formatValueByType(value, type));
		}
	}, [bound, type, value]);

	useEffect(() => {
		if (bound && type === "string[]" && binding) {
			setBindingStringArrayInput(formatValueByType(binding.fallback, type));
		}
	}, [binding, bound, type]);

	const toggleMode = () => {
		if (bound) {
			onChange(type === "number" ? 0 : type === "boolean" ? false : "");
		} else {
			onChange({ kind: "binding", column: "" });
		}
	};

	const renderDirectInput = () => {
		if (type === "boolean") {
			return (
				<label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
					<input
						type="checkbox"
						checked={!!value}
						onChange={(e) => onChange(e.target.checked)}
					/>
					<span style={{ fontSize: 12 }}>{value ? "Yes" : "No"}</span>
				</label>
			);
		}

		if (type === "select" && options) {
			return (
				<S.FieldSelect
					value={String(value ?? "")}
					onChange={(e) => onChange(e.target.value)}
				>
					{options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</S.FieldSelect>
			);
		}

		if (type === "number") {
			return (
				<S.FieldInput
					type="number"
					value={value === undefined || value === null ? "" : String(value)}
					onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
					placeholder={placeholder}
				/>
			);
		}

			if (type === "string[]") {
				return (
					<S.FieldInput
						value={directStringArrayInput}
						onChange={(e) => setDirectStringArrayInput(e.target.value)}
						onBlur={() => onChange(parseValueByType(directStringArrayInput, type) ?? [])}
						placeholder={placeholder ?? "value1, value2, value3"}
					/>
				);
			}

		return (
			<S.FieldInput
				value={String(value ?? "")}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
			/>
		);
	};

	const renderBindingInput = () => {
		if (!binding) return null;

		const handleFallbackChange = (raw: string) => {
			onChange({
				...binding,
				fallback: parseValueByType(raw, type),
			});
		};

		const renderFallbackInput = () => {
			if (type === "boolean") {
				return (
					<S.FieldSelect
						value={formatValueByType(binding.fallback, type)}
						onChange={(e) => handleFallbackChange(e.target.value)}
					>
						<option value="">No fallback</option>
						<option value="true">True</option>
						<option value="false">False</option>
					</S.FieldSelect>
				);
			}

			if (type === "select" && options) {
				return (
					<S.FieldSelect
						value={formatValueByType(binding.fallback, type)}
						onChange={(e) => handleFallbackChange(e.target.value)}
					>
						<option value="">No fallback</option>
						{options.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</S.FieldSelect>
				);
			}

			if (type === "number") {
				return (
					<S.FieldInput
						type="number"
						value={formatValueByType(binding.fallback, type)}
						onChange={(e) => handleFallbackChange(e.target.value)}
						placeholder="Fallback (optional)"
					/>
				);
			}

			return (
				<S.FieldInput
					value={bindingStringArrayInput}
					onChange={(e) => setBindingStringArrayInput(e.target.value)}
					onBlur={() => handleFallbackChange(bindingStringArrayInput)}
					placeholder={
						type === "string[]" ? "Fallback (a, b, c)" : "Fallback (optional)"
					}
				/>
			);
		};

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
				<S.FieldInput
					value={binding.column ?? ""}
					onChange={(e) =>
						onChange({ ...binding, column: e.target.value })
					}
						placeholder="Column name"
					/>
					{renderFallbackInput()}
			</div>
		);
	};

	return (
		<S.BoundFieldWrapper>
			<S.BoundFieldRow>
				<S.PropertyLabel style={{ flex: 1 }}>{label}</S.PropertyLabel>
				<S.BindingToggle $active={bound} onClick={toggleMode}>
					{bound ? "Binding" : "Value"}
				</S.BindingToggle>
			</S.BoundFieldRow>
			{bound ? renderBindingInput() : renderDirectInput()}
		</S.BoundFieldWrapper>
	);
};

export default BoundField;
