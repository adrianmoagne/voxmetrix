import { useEffect, useState } from "react";

interface FixationGateOverlayProps {
	durationMs: number;
	hideCursor?: boolean;
	onComplete: () => void;
}

const FixationGateOverlay: React.FC<FixationGateOverlayProps> = ({
	durationMs,
	hideCursor = false,
	onComplete,
}) => {
	const [active, setActive] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setActive(false);
			onComplete();
		}, durationMs);

		return () => clearTimeout(timer);
	}, [durationMs, onComplete]);

	if (!active) return null;

	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#fff",
				zIndex: 10,
				cursor: hideCursor ? "none" : "default",
			}}
		>
			<div
				style={{
					width: 40,
					height: 40,
					position: "relative",
				}}
			>
				{/* Horizontal bar */}
				<div
					style={{
						position: "absolute",
						top: "50%",
						left: 0,
						right: 0,
						height: 3,
						backgroundColor: "#333",
						transform: "translateY(-50%)",
					}}
				/>
				{/* Vertical bar */}
				<div
					style={{
						position: "absolute",
						left: "50%",
						top: 0,
						bottom: 0,
						width: 3,
						backgroundColor: "#333",
						transform: "translateX(-50%)",
					}}
				/>
			</div>
		</div>
	);
};

export default FixationGateOverlay;
