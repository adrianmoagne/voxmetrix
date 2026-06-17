import type { ScreenBehaviorEntity, ScreenChildEntity, SpreadsheetRow } from "@/@types/screen.model";
import { resolveBound } from "../resolveBound";
import AdvanceRuleController from "./AdvanceRuleController";
import EyeTrackingController from "./EyeTrackingController";

const TRACKABLE_KINDS = new Set<ScreenChildEntity["kind"]>(["Image"]);

interface BehaviorControllersProps {
	behaviors: ScreenBehaviorEntity[];
	children: ScreenChildEntity[];
	row?: SpreadsheetRow;
}

const BehaviorControllers: React.FC<BehaviorControllersProps> = ({ behaviors, children, row }) => {
	return (
		<>
			{behaviors.map((behavior) => {
				switch (behavior.kind) {
					case "AdvanceRule":
						return (
							<AdvanceRuleController
								key={behavior.uid}
								when={behavior.props.when}
								timeoutMs={
									behavior.props.timeoutMs
										? resolveBound(behavior.props.timeoutMs, row)
										: undefined
								}
							/>
						);

					case "EyeTracking":
						return (
							<EyeTrackingController
								key={behavior.uid}
								startOn={behavior.props.startOn}
								stopOn={behavior.props.stopOn}
								targets={behavior.props.targets}
								trackableEntityUids={children
									.filter((child) => TRACKABLE_KINDS.has(child.kind))
									.map((child) => child.uid)}
								hideCursor={
									behavior.props.hideCursor
										? resolveBound(behavior.props.hideCursor, row)
										: false
								}
							/>
						);

					case "FixationGate":
						// FixationGate rendering is handled by ScreenOverlays
						return null;

					default:
						return null;
				}
			})}
		</>
	);
};

export default BehaviorControllers;
