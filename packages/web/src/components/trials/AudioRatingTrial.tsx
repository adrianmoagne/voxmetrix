import { useState } from "react";
import { Radio, Button, Typography } from "@leux/ui";
import { lightTheme } from "@/styles";
import { AudioPlayer } from "@/components";

interface AudioRatingTrialProps {
	audioSource: string;
	prompt: string;
	scale: string[];
	audioTrialIndex?: number;
	totalAudioTrials?: number;
	onComplete: (response: { response: string }) => void;
}

const AudioRatingTrial: React.FC<AudioRatingTrialProps> = ({
	audioSource,
	prompt,
	scale,
	audioTrialIndex,
	totalAudioTrials,
	onComplete,
}) => {
	const [selected, setSelected] = useState<string | null>(null);

	const handleRadioChange = (e: string | { value?: string; target?: { value?: string } }) => {
		const val = typeof e === "string" ? e : e?.target?.value ?? e?.value ?? null;
		setSelected(val);
	};

	const handleSubmit = () => {
		if (selected === null) return;
		onComplete({ response: selected });
	};

	return (
		<div style={{ margin: "0 auto", textAlign: "center" }}>
			<div
				style={{
					marginTop: 20,
					display: "flex",
					justifyContent: "center",
					flexDirection: "column",
					alignItems: "center",
					gap: 12,
				}}
			>
				{audioTrialIndex != null && totalAudioTrials != null && (
					<div style={{ marginBottom: 4 }}>
						<Typography variant="caption">
							Audio {audioTrialIndex} / {totalAudioTrials}
						</Typography>
					</div>
				)}
				<AudioPlayer src={audioSource} />
				<Typography>{prompt}</Typography>
			</div>
			<div
				style={{
					marginTop: 12,
					display: "flex",
					flexDirection: "column",
					gap: 12,
					justifyContent: "center",
					flexWrap: "wrap",
				}}
			>
				{scale.map((n: string) => {
					const v = String(n);
					return (
						<Radio
							key={v}
							fieldKey="mos"
							value={v}
							defaultChecked={selected === v}
							label={v}
							onChange={handleRadioChange}
							customStyles={{
								marginRight: 12,
								accentColor: lightTheme.primary,
								color: lightTheme.primary,
								fontSize: 16,
							}}
						/>
					);
				})}
			</div>
			<div style={{ marginTop: 16 }}>
				<Button
					colorScheme="primary"
					onClick={handleSubmit}
					state={{ disabled: selected === null }}
				>
					Confirm
				</Button>
			</div>
		</div>
	);
};

export default AudioRatingTrial;
