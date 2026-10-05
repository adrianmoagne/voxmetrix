import { useState } from "react";
import { Button, Radio, Typography, Tooltip } from "@leux/ui";
import type { RatingOption, RatingResponse } from "@/@types/screen.model";
import { useScreenRuntime } from "../ScreenRuntimeContext";

export const DEFAULT_RATING_CONFIRM_LABEL = "Confirm";
export const DEFAULT_RATING_LOCKED_HINT = "Listen to all the audios";

interface RatingScaleEntityProps {
	uid: string;
	prompt: string;
	options: RatingOption[];
	confirmLabel?: string;
	lockedHint?: string;
}

const RatingScaleEntity: React.FC<RatingScaleEntityProps> = ({
	uid,
	prompt,
	options,
	confirmLabel = DEFAULT_RATING_CONFIRM_LABEL,
	lockedHint = DEFAULT_RATING_LOCKED_HINT,
}) => {
	const { isEntityInteractive, responseStates, markResponseSelected, markResponseCompleted } =
		useScreenRuntime();
	const active = isEntityInteractive(uid);
	const completed = responseStates[uid]?.completed ?? false;
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	const handleSelect = (index: number) => {
		setSelectedIndex(index);
		markResponseSelected(uid);
	};

	const handleConfirm = () => {
		if (selectedIndex === null) return;
		const option = options[selectedIndex];
		if (!option) return;

		const response: RatingResponse = {
			index: selectedIndex,
			value: option.value,
			label: option.label,
		};
		markResponseCompleted(uid, response);
	};

	const lockedButton = (
		<Button colorScheme="primary" state={{ disabled: true }}>
			{confirmLabel}
		</Button>
	);

	return (
		<div
			data-entity-uid={uid}
			style={{
				textAlign: "center",
				padding: 16,
				opacity: active ? 1 : 0.5,
				pointerEvents: active && !completed ? "auto" : "none",
			}}
		>
			<Typography variant="body-1">{prompt}</Typography>
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					flexDirection: "column",
					gap: 16,
					marginTop: 12,
				}}
			>
				{options.map((option, index) => (
					<Radio
						key={`${index}-${option.label}`}
						fieldKey={`rating-${uid}`}
						value={String(index)}
						label={option.label}
						defaultChecked={selectedIndex === index}
						onChange={() => handleSelect(index)}
					/>
				))}
			</div>
			<div style={{ marginTop: 16, pointerEvents: "auto", display: "flex", justifyContent: "center" }}>
				{!active ? (
					lockedHint ? (
						<Tooltip title={lockedHint} direction="right">
							<span style={{ display: "inline-block" }}>{lockedButton}</span>
						</Tooltip>
					) : (
						lockedButton
					)
				) : (
					<Button
						colorScheme="primary"
						state={{ disabled: selectedIndex === null || completed }}
						onClick={handleConfirm}
					>
						{confirmLabel}
					</Button>
				)}
			</div>
		</div>
	);
};

export default RatingScaleEntity;
