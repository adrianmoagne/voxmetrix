import { Typography } from "@leux/ui";
import type {
	ScreenChildEntity,
	ScreenBehaviorEntity,
	GridType,
	Placement,
	Bound,
} from "@/@types/screen.model";
import BoundField from "./BoundField";
import PlacementEditor from "./PlacementEditor";
import S from "./ScreenEntityEditor.styles";

interface PropertiesTabProps {
	entity: ScreenChildEntity | ScreenBehaviorEntity | null;
	gridType: GridType;
	onUpdateName: (uid: string, name: string) => void;
	onUpdateChildProps: (uid: string, props: Record<string, unknown>) => void;
	onUpdateChildPlacement: (uid: string, placement: Partial<Placement>) => void;
	onUpdateBehaviorProps: (uid: string, props: Record<string, unknown>) => void;
}

const PropertiesTab: React.FC<PropertiesTabProps> = ({
	entity,
	gridType,
	onUpdateName,
	onUpdateChildProps,
	onUpdateChildPlacement,
	onUpdateBehaviorProps,
}) => {
	if (!entity) {
		return (
			<Typography variant="caption" textColor="placeholder">
				Select an entity to edit its properties.
			</Typography>
		);
	}

	const handlePropChange = (uid: string, key: string, value: Bound<unknown>) => {
		if ("placement" in entity) {
			onUpdateChildProps(uid, { [key]: value });
		} else {
			onUpdateBehaviorProps(uid, { [key]: value });
		}
	};

	return (
		<>
			{/* Name */}
			<S.PropertySection>
				<S.PropertyLabel>Name</S.PropertyLabel>
				<S.FieldInput
					value={entity.name}
					onChange={(e) => onUpdateName(entity.uid, e.target.value)}
				/>
			</S.PropertySection>

			{/* Kind-specific props */}
			<S.PropertySection>
				<S.PropertyLabel>{entity.kind} Properties</S.PropertyLabel>
				{"placement" in entity ? (
					<ChildProps entity={entity} onChange={handlePropChange} />
				) : (
					<BehaviorProps entity={entity} onChange={handlePropChange} />
				)}
			</S.PropertySection>

			{/* Placement (child only) */}
			{"placement" in entity && (
				<PlacementEditor
					placement={entity.placement}
					gridType={gridType}
					onChange={(update) => onUpdateChildPlacement(entity.uid, update)}
				/>
			)}
		</>
	);
};

// --- Child property forms ---

const ChildProps: React.FC<{
	entity: ScreenChildEntity;
	onChange: (uid: string, key: string, value: Bound<unknown>) => void;
}> = ({ entity, onChange }) => {
	const uid = entity.uid;

	switch (entity.kind) {
		case "AudioPlayer":
			return (
				<>
					<BoundField label="Audio Source" value={entity.props.audioSrc} onChange={(v) => onChange(uid, "audioSrc", v)} placeholder="URL or binding" />
					<BoundField label="Label" value={entity.props.label ?? ""} onChange={(v) => onChange(uid, "label", v)} placeholder="Optional label" />
					<BoundField label="Autoplay" value={entity.props.autoplay ?? false} onChange={(v) => onChange(uid, "autoplay", v)} type="boolean" />
					<BoundField label="Hidden" value={entity.props.hidden ?? false} onChange={(v) => onChange(uid, "hidden", v)} type="boolean" />
				</>
			);
		case "Image":
			return (
				<>
					<BoundField label="Image Source" value={entity.props.imageSrc} onChange={(v) => onChange(uid, "imageSrc", v)} placeholder="URL or binding" />
					<BoundField label="Alt Text" value={entity.props.alt ?? ""} onChange={(v) => onChange(uid, "alt", v)} placeholder="Optional alt text" />
				</>
			);
		case "Text":
			return (
				<>
					<BoundField label="Text" value={entity.props.text} onChange={(v) => onChange(uid, "text", v)} placeholder="Text content" />
					<BoundField label="Font Size" value={entity.props.fontSize ?? 16} onChange={(v) => onChange(uid, "fontSize", v)} type="number" />
					<BoundField
						label="Align"
						value={entity.props.align ?? "center"}
						onChange={(v) => onChange(uid, "align", v)}
						type="select"
						options={[
							{ label: "Left", value: "left" },
							{ label: "Center", value: "center" },
							{ label: "Right", value: "right" },
						]}
					/>
				</>
			);
		case "RatingScale":
			return (
				<>
					<BoundField label="Prompt" value={entity.props.prompt} onChange={(v) => onChange(uid, "prompt", v)} placeholder="Rating prompt" />
					<BoundField label="Scale" value={entity.props.scale} onChange={(v) => onChange(uid, "scale", v)} type="string[]" placeholder="1, 2, 3, 4, 5" />
				</>
			);
		case "TextHighlighter":
			return (
				<>
					<BoundField label="Text" value={entity.props.text} onChange={(v) => onChange(uid, "text", v)} placeholder="Text to highlight" />
					<BoundField label="Highlight Color" value={entity.props.highlightColor ?? "rgba(255,255,0,0.3)"} onChange={(v) => onChange(uid, "highlightColor", v)} />
				</>
			);
		case "ContinueButton":
			return (
				<BoundField label="Label" value={entity.props.label ?? "Continue"} onChange={(v) => onChange(uid, "label", v)} />
			);
		default:
			return null;
	}
};

// --- Behavior property forms ---

const BehaviorProps: React.FC<{
	entity: ScreenBehaviorEntity;
	onChange: (uid: string, key: string, value: Bound<unknown> | string) => void;
}> = ({ entity, onChange }) => {
	const uid = entity.uid;

	switch (entity.kind) {
		case "EyeTracking":
			return (
				<>
					<BoundField
						label="Start On"
						value={entity.props.startOn}
						onChange={(v) => onChange(uid, "startOn", v)}
						type="select"
						options={[
							{ label: "Screen Enter", value: "screen-enter" },
							{ label: "Audio Start", value: "audio-start" },
						]}
					/>
					<BoundField
						label="Stop On"
						value={entity.props.stopOn}
						onChange={(v) => onChange(uid, "stopOn", v)}
						type="select"
						options={[
							{ label: "Audio End", value: "audio-end" },
							{ label: "Continue Click", value: "continue-click" },
							{ label: "Responses Complete", value: "responses-complete" },
							{ label: "Screen Exit", value: "screen-exit" },
						]}
					/>
					<BoundField label="Hide Cursor" value={entity.props.hideCursor ?? false} onChange={(v) => onChange(uid, "hideCursor", v)} type="boolean" />
					<BoundField
						label="Calibration Policy"
						value={entity.props.calibrationPolicy ?? "none"}
						onChange={(v) => onChange(uid, "calibrationPolicy", v)}
						type="select"
						options={[
							{ label: "None", value: "none" },
							{ label: "Once Before First", value: "once-before-first" },
							{ label: "Per Block", value: "per-block" },
						]}
					/>
				</>
			);
		case "AdvanceRule":
			return (
				<>
					<BoundField
						label="When"
						value={entity.props.when}
						onChange={(v) => onChange(uid, "when", v)}
						type="select"
						options={[
							{ label: "Continue Click", value: "continue-click" },
							{ label: "Audio Ended", value: "audio-ended" },
							{ label: "Responses Complete", value: "responses-complete" },
							{ label: "Timeout", value: "timeout" },
						]}
					/>
					{entity.props.when === "timeout" && (
						<BoundField
							label="Timeout (ms)"
							value={entity.props.timeoutMs ?? 5000}
							onChange={(v) => onChange(uid, "timeoutMs", v)}
							type="number"
						/>
					)}
				</>
			);
		case "FixationGate":
			return (
				<>
					<BoundField label="Duration (ms)" value={entity.props.durationMs} onChange={(v) => onChange(uid, "durationMs", v)} type="number" />
					<BoundField label="Hide Cursor" value={entity.props.hideCursor ?? false} onChange={(v) => onChange(uid, "hideCursor", v)} type="boolean" />
				</>
			);
		case "AudioProgress":
			return (
				<BoundField
					label="Label"
					value={entity.props.label ?? "Audio"}
					onChange={(v) => onChange(uid, "label", v)}
					type="string"
				/>
			);
		case "LateralCounterbalance":
			return (
				<>
					<ColumnField
						label="Stimulus A column"
						value={entity.props.columnA}
						onChange={(value) => onChange(uid, "columnA", value)}
						placeholder="image_a"
					/>
					<ColumnField
						label="Stimulus B column"
						value={entity.props.columnB}
						onChange={(value) => onChange(uid, "columnB", value)}
						placeholder="image_b"
					/>
					<ColumnField
						label="Left slot column"
						value={entity.props.leftColumn}
						onChange={(value) => onChange(uid, "leftColumn", value)}
						placeholder="image_left"
					/>
					<ColumnField
						label="Right slot column"
						value={entity.props.rightColumn}
						onChange={(value) => onChange(uid, "rightColumn", value)}
						placeholder="image_right"
					/>
					<Typography variant="caption" textColor="placeholder">
						Bind left/right Image entities to the slot columns. Put stimulus URLs in the A/B
						columns on each spreadsheet row.
					</Typography>
				</>
			);
		default:
			return null;
	}
};

const ColumnField: React.FC<{
	label: string;
	value: string;
	placeholder?: string;
	onChange: (value: string) => void;
}> = ({ label, value, placeholder, onChange }) => (
	<S.PropertySection>
		<S.PropertyLabel>{label}</S.PropertyLabel>
		<S.FieldInput
			value={value}
			placeholder={placeholder}
			onChange={(event) => onChange(event.target.value)}
		/>
	</S.PropertySection>
);

export default PropertiesTab;
