import { useState } from "react";
import { Button, Radio, Typography, Tooltip } from "@leux/ui";
import { useScreenRuntime } from "../ScreenRuntimeContext";

interface RatingScaleEntityProps {
	uid: string;
	prompt: string;
	scale: string[];
}

const RatingScaleEntity: React.FC<RatingScaleEntityProps> = ({
	uid,
	prompt,
	scale,
}) => {
	const { isEntityInteractive, responseStates, markResponseCompleted } = useScreenRuntime();
	const active = isEntityInteractive(uid);
	const completed = responseStates[uid]?.completed ?? false;
	const [selectedValue, setSelectedValue] = useState<string | null>(null);

	const handleConfirm = () => {
		if (selectedValue === null) return;
		markResponseCompleted(uid, selectedValue);
	};

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
				{scale.map((v) => (
					<Radio
						key={v}
						fieldKey={`rating-${uid}`}
						value={v}
						label={v}
						defaultChecked={selectedValue === v}
						onChange={() => setSelectedValue(v)}
					/>
				))}
			</div>
			<div style={{ marginTop: 16, pointerEvents: "auto", display: "flex", justifyContent: "center" }}>
				{!active ? (
					<Tooltip title="Listen to all the audios" direction="right">
						<span style={{ display: "inline-block" }}>
							<Button
								colorScheme="primary"
								state={{ disabled: true }}
							>
								Confirm
							</Button>
						</span>
					</Tooltip>
				) : (
					<Button
						colorScheme="primary"
						state={{ disabled: selectedValue === null || completed }}
						onClick={handleConfirm}
					>
						Confirm
					</Button>
				)}
			</div>
		</div >
	);
};

export default RatingScaleEntity;
