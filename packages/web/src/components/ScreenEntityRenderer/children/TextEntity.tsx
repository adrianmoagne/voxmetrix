import { renderTextMarkdown } from "@/utils";

export const DEFAULT_TEXT_FONT_SIZE = 14;

interface TextEntityProps {
	uid: string;
	text: string;
	fontSize?: number;
	align?: "left" | "center" | "right";
}

const TextEntity: React.FC<TextEntityProps> = ({
	uid,
	text,
	fontSize = DEFAULT_TEXT_FONT_SIZE,
	align = "center",
}) => {
	return (
		<div
			data-entity-uid={uid}
			style={{
				padding: "8px",
				maxWidth: "75ch",
				textAlign: align,
				wordBreak: "break-word",
				fontSize: `${fontSize}px`,
				lineHeight: 1.5,
				color: "#333",
			}}
		>
			{renderTextMarkdown(text ?? "", { align })}
		</div>
	);
};

export default TextEntity;
