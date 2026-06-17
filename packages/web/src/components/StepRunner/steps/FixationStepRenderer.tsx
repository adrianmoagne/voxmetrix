import { useEffect, useRef } from "react";
import type { BaseEntity, Bound, SpreadsheetRow, ScreenCompletionData } from "@/@types/screen.model";
import { resolveBound } from "@/components/ScreenEntityRenderer/resolveBound";
import { buildStepResult } from "../buildStepResult";

type FixationStepEntity = BaseEntity<
	"FixationStep",
	{ durationMs: Bound<number>; hideCursor?: Bound<boolean> }
>;

interface FixationStepRendererProps {
	step: FixationStepEntity;
	row: SpreadsheetRow;
	onComplete: (data: ScreenCompletionData) => void;
}

const FixationStepRenderer: React.FC<FixationStepRendererProps> = ({ step, row, onComplete }) => {
	const durationMs = resolveBound(step.props.durationMs, row);
	const hideCursor = step.props.hideCursor ? resolveBound(step.props.hideCursor, row) : true;
	const startedAtRef = useRef(Date.now());

	useEffect(() => {
		const timer = setTimeout(() => {
			onComplete(
				buildStepResult({
					stepUid: step.uid,
					row,
					startedAt: startedAtRef.current,
					advanceReason: "timeout",
				})
			);
		}, durationMs);
		return () => clearTimeout(timer);
	}, [durationMs, step.uid, row.uid, onComplete]);

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				height: "100%",
				cursor: hideCursor ? "none" : "default",
			}}
		>
			<div style={{ position: "relative", width: 40, height: 40 }}>
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

export default FixationStepRenderer;
