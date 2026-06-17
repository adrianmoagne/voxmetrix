import { useEffect } from "react";

interface FixationCrossTrialProps {
	duration?: number;
	onComplete: (response: null) => void;
}

const FixationCrossTrial: React.FC<FixationCrossTrialProps> = ({
	duration = 3000,
	onComplete,
}) => {
	useEffect(() => {
		const timer = setTimeout(() => {
			onComplete(null);
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, onComplete]);

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				height: "100%",
				fontSize: "200px",
				cursor: "none",
			}}
		>
			+
		</div>
	);
};

export default FixationCrossTrial;
