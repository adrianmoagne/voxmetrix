import type { ScreenBehaviorEntity, SpreadsheetRow } from "@/@types/screen.model";
import type { AudioProgressState } from "@/utils/audioProgressUtils";
import { useScreenRuntime } from "../ScreenRuntimeContext";
import { resolveBound } from "../resolveBound";
import AudioProgressOverlay from "./AudioProgressOverlay";
import FixationGateOverlay from "./FixationGateOverlay";

interface ScreenOverlaysProps {
	behaviors: ScreenBehaviorEntity[];
	row?: SpreadsheetRow;
	audioProgress?: AudioProgressState | null;
}

const ScreenOverlays: React.FC<ScreenOverlaysProps> = ({ behaviors, row, audioProgress }) => {
	const { fixationActive, clearFixation } = useScreenRuntime();
	const audioProgressBehavior = behaviors.find((behavior) => behavior.kind === "AudioProgress");

	return (
		<>
			{audioProgressBehavior && audioProgress && (
				<AudioProgressOverlay
					key={audioProgressBehavior.uid}
					progress={audioProgress}
					label={
						audioProgressBehavior.props.label
							? resolveBound(audioProgressBehavior.props.label, row)
							: "Audio"
					}
				/>
			)}
			{behaviors.map((behavior) => {
				if (behavior.kind === "FixationGate" && fixationActive) {
					return (
						<FixationGateOverlay
							key={behavior.uid}
							durationMs={resolveBound(behavior.props.durationMs, row)}
							hideCursor={
								behavior.props.hideCursor
									? resolveBound(behavior.props.hideCursor, row)
									: false
							}
							onComplete={clearFixation}
						/>
					);
				}
				return null;
			})}
		</>
	);
};

export default ScreenOverlays;
