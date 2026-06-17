import { Volume2, Image, Type, Star, Edit3, SkipForward, X } from "react-feather";
import type { ScreenChildEntity } from "@/@types/screen.model";
import { entityColors } from "./ScreenEntityEditor.styles";
import S from "./ScreenEntityEditor.styles";

type ChildKind = ScreenChildEntity["kind"];

const catalogItems: {
	category: string;
	items: { kind: ChildKind; label: string; description: string; icon: React.FC<{ size?: number; color?: string }> }[];
}[] = [
	{
		category: "Stimuli",
		items: [
			{ kind: "AudioPlayer", label: "Audio Player", description: "Play audio files", icon: Volume2 },
			{ kind: "Image", label: "Image", description: "Display an image", icon: Image },
			{ kind: "Text", label: "Text", description: "Show text content", icon: Type },
		],
	},
	{
		category: "Responses",
		items: [
			{ kind: "RatingScale", label: "Rating Scale", description: "MOS-style rating", icon: Star },
			{ kind: "TextHighlighter", label: "Text Highlighter", description: "Highlight text spans", icon: Edit3 },
		],
	},
	{
		category: "Controls",
		items: [
			{ kind: "ContinueButton", label: "Continue Button", description: "Advance to next screen", icon: SkipForward },
		],
	},
];

interface EntityCatalogProps {
	onAdd: (kind: ChildKind) => void;
	onClose: () => void;
}

const EntityCatalog: React.FC<EntityCatalogProps> = ({ onAdd, onClose }) => {
	return (
		<S.CatalogOverlay onClick={onClose}>
			<S.CatalogPanel onClick={(e) => e.stopPropagation()}>
				<S.CatalogHeader>
					<span style={{ color: "#2c2c30", fontSize: 15, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
						Add Entity
					</span>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							color: "#a0a0a8",
							cursor: "pointer",
							padding: 4,
							display: "flex",
						}}
					>
						<X size={16} />
					</button>
				</S.CatalogHeader>
				{catalogItems.map((section) => (
					<S.CatalogSection key={section.category}>
						<S.PropertyLabel style={{ marginBottom: 6 }}>
							{section.category}
						</S.PropertyLabel>
						{section.items.map((item) => {
							const Icon = item.icon;
							const colors = entityColors[item.kind];
							return (
								<S.CatalogItem
									key={item.kind}
									onClick={() => onAdd(item.kind)}
								>
									<S.ObjectIcon
										style={{
											background: colors?.bg ?? "#f0f0ee",
											border: `1px solid ${colors?.border ?? "#e4e4e0"}`,
										}}
									>
										<Icon size={16} color={colors?.fg ?? "#556270"} />
									</S.ObjectIcon>
									<div>
										<div style={{ fontSize: 13, fontWeight: 500, color: "#2c2c30" }}>
											{item.label}
										</div>
										<div style={{ fontSize: 11, color: "#7a7a84" }}>
											{item.description}
										</div>
									</div>
								</S.CatalogItem>
							);
						})}
					</S.CatalogSection>
				))}
			</S.CatalogPanel>
		</S.CatalogOverlay>
	);
};

export default EntityCatalog;
