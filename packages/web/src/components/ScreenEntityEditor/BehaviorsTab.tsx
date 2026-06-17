import { Typography } from "@leux/ui";
import { Eye, SkipForward, Crosshair, Trash2, List, Shuffle } from "react-feather";
import { useTheme } from "@emotion/react";
import type { ScreenBehaviorEntity } from "@/@types/screen.model";
import S from "./ScreenEntityEditor.styles";

type BehaviorKind = ScreenBehaviorEntity["kind"];

const behaviorDefs: {
	kind: BehaviorKind;
	label: string;
	description: string;
	icon: React.FC<{ size?: number; color?: string }>;
}[] = [
		{ kind: "EyeTracking", label: "Eye Tracking", description: "Enable gaze tracking", icon: Eye },
		{ kind: "AdvanceRule", label: "Advance Rule", description: "Control screen advancement", icon: SkipForward },
		{ kind: "FixationGate", label: "Fixation Gate", description: "Fixation cross before content", icon: Crosshair },
		{ kind: "AudioProgress", label: "Audio Progress", description: "Show audio trial counter (e.g. 1/60)", icon: List },
		{
			kind: "LateralCounterbalance",
			label: "Lateral Counterbalance",
			description: "Randomly swap left/right each trial",
			icon: Shuffle,
		},
	];

interface BehaviorsTabProps {
	behaviors: ScreenBehaviorEntity[];
	selectedUid: string | null;
	onSelect: (uid: string) => void;
	onToggle: (kind: BehaviorKind) => void;
}

const BehaviorsTab: React.FC<BehaviorsTabProps> = ({
	behaviors,
	// selectedUid,
	onSelect,
	onToggle,
}) => {
	const theme = useTheme();

	return (
		<>
			<S.SectionLabel>
				<Typography variant="caption" textColor="placeholder">
					Behaviors
				</Typography>
			</S.SectionLabel>
			{behaviorDefs.map((def) => {
				const active = behaviors.find((b) => b.kind === def.kind);
				const Icon = def.icon;
				return (
					<S.ComponentToggle
						key={def.kind}
						$active={!!active}
						onClick={() => {
							if (active) {
								onSelect(active.uid);
								return;
							}
							onToggle(def.kind);
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
							<Icon
								size={16}
								color={active ? theme.main.primary : theme.main.placeholder}
							/>
							<div>
								<Typography
									variant="body-2"
									textColor={active ? "primary" : "textOne"}
								>
									{def.label}
								</Typography>
								<Typography variant="caption" textColor="placeholder">
									{def.description}
								</Typography>
							</div>
						</div>
						<Trash2
							size={14}
							color={theme.main.placeholder}
							style={{ cursor: "pointer", flexShrink: 0 }}
							onClick={(e) => {
								e.stopPropagation();
								if (active) {
									onToggle(def.kind);
								}

							}}
						/>
						<S.ToggleDot $active={!!active} />
					</S.ComponentToggle>
				);
			})}
		</>
	);
};

export default BehaviorsTab;
