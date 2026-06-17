import type { ScreenChildEntity, SpreadsheetRow } from "@/@types/screen.model";
import { resolveBound } from "./resolveBound";
import AudioPlayerEntity from "./children/AudioPlayerEntity";
import ImageEntity from "./children/ImageEntity";
import TextEntity from "./children/TextEntity";
import RatingScaleEntity from "./children/RatingScaleEntity";
import TextHighlighterEntity from "./children/TextHighlighterEntity";
import ContinueButtonEntity from "./children/ContinueButtonEntity";

interface ChildEntityRendererProps {
	entity: ScreenChildEntity;
	row?: SpreadsheetRow;
}

const ChildEntityRenderer: React.FC<ChildEntityRendererProps> = ({ entity, row }) => {
	switch (entity.kind) {
		case "AudioPlayer":
			return (
				<AudioPlayerEntity
					uid={entity.uid}
					audioSrc={resolveBound(entity.props.audioSrc, row)}
					label={entity.props.label ? resolveBound(entity.props.label, row) : undefined}
					autoplay={entity.props.autoplay ? resolveBound(entity.props.autoplay, row) : false}
					hidden={entity.props.hidden ? resolveBound(entity.props.hidden, row) : false}
				/>
			);

		case "Image":
			return (
				<ImageEntity
					uid={entity.uid}
					imageSrc={resolveBound(entity.props.imageSrc, row)}
					alt={entity.props.alt ? resolveBound(entity.props.alt, row) : undefined}
					trackingTargetId={entity.trackingTarget?.id}
				/>
			);

		case "Text":
			return (
				<TextEntity
					uid={entity.uid}
					text={resolveBound(entity.props.text, row)}
					fontSize={entity.props.fontSize ? resolveBound(entity.props.fontSize, row) : undefined}
					align={entity.props.align ? resolveBound(entity.props.align, row) : undefined}
				/>
			);

		case "RatingScale":
			return (
				<RatingScaleEntity
					uid={entity.uid}
					prompt={resolveBound(entity.props.prompt, row)}
					scale={resolveBound(entity.props.scale, row)}
				/>
			);

		case "TextHighlighter":
			return (
				<TextHighlighterEntity
					uid={entity.uid}
					text={resolveBound(entity.props.text, row)}
					highlightColor={
						entity.props.highlightColor
							? resolveBound(entity.props.highlightColor, row)
							: undefined
					}
				/>
			);

		case "ContinueButton":
			return (
				<ContinueButtonEntity
					uid={entity.uid}
					label={entity.props.label ? resolveBound(entity.props.label, row) : undefined}
				/>
			);

		default:
			return null;
	}
};

export default ChildEntityRenderer;
