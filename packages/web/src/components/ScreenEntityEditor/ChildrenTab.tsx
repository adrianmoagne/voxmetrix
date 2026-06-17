import { Typography } from "@leux/ui";
import { Volume2, Image, Type, Star, Edit3, SkipForward, Trash2 } from "react-feather";
import { useTheme } from "@emotion/react";
import { PlusCircle } from "react-feather";
import type { ScreenChildEntity } from "@/@types/screen.model";
import S from "./ScreenEntityEditor.styles";

const kindIcons: Record<
	ScreenChildEntity["kind"],
	React.FC<{ size?: number; color?: string }>
> = {
	AudioPlayer: Volume2,
	Image: Image,
	Text: Type,
	RatingScale: Star,
	TextHighlighter: Edit3,
	ContinueButton: SkipForward,
};

const kindPhase: Record<ScreenChildEntity["kind"], string> = {
	AudioPlayer: "stimulus",
	Image: "stimulus",
	Text: "all",
	RatingScale: "response",
	TextHighlighter: "response",
	ContinueButton: "ready",
};

interface ChildrenTabProps {
	children: ScreenChildEntity[];
	selectedUid: string | null;
	onSelect: (uid: string) => void;
	onDelete: (uid: string) => void;
	onShowCatalog: () => void;
}

const ChildrenTab: React.FC<ChildrenTabProps> = ({
	children,
	selectedUid,
	onSelect,
	onDelete,
	onShowCatalog,
}) => {
	const theme = useTheme();

	return (
		<>
			{children.length === 0 && (
				<Typography variant="caption" textColor="placeholder">
					No entities yet. Add entities to build your screen.
				</Typography>
			)}
			{children.map((child) => {
				const Icon = kindIcons[child.kind];
				const phase = child.phase ?? kindPhase[child.kind];
				return (
					<S.ObjectItem
						key={child.uid}
						$selected={selectedUid === child.uid}
						onClick={() => onSelect(child.uid)}
					>
						<S.ObjectIcon>
							<Icon size={16} color={theme.main.textOne} />
						</S.ObjectIcon>
						<div style={{ flex: 1, minWidth: 0 }}>
							<Typography variant="body-2" textColor="textOne">
								{child.name}
							</Typography>
							<div style={{ display: "flex", gap: 4, alignItems: "center" }}>
								<Typography variant="caption" textColor="placeholder">
									{child.kind}
								</Typography>
								<S.PhaseBadge $phase={phase}>{phase}</S.PhaseBadge>
							</div>
						</div>
						<Trash2
							size={14}
							color={theme.main.placeholder}
							style={{ cursor: "pointer", flexShrink: 0 }}
							onClick={(e) => {
								e.stopPropagation();
								onDelete(child.uid);
							}}
						/>
					</S.ObjectItem>
				);
			})}
			<S.AddButton onClick={onShowCatalog}>
				<PlusCircle size={14} />
				Add Entity
			</S.AddButton>
		</>
	);
};

export default ChildrenTab;
