import type { AudioProgressState } from "@/utils/audioProgressUtils";

interface AudioProgressOverlayProps {
	progress: AudioProgressState;
	label?: string;
}

const AudioProgressOverlay: React.FC<AudioProgressOverlayProps> = ({
	progress,
	label = "Audio",
}) => {
	return (
		<div
			style={{
				position: "absolute",
				top: 16,
				right: 16,
				zIndex: 1000,
				padding: "6px 12px",
				borderRadius: 999,
				background: "rgba(0, 0, 0, 0.65)",
				color: "#fff",
				pointerEvents: "none",
			}}
		>
			<span style={{ color: "#fff", fontSize: 12 }}>
				{label} {progress.current} / {progress.total}
			</span>
		</div>
	);
};

export default AudioProgressOverlay;
