interface TextEntityProps {
	uid: string;
	text: string;
	fontSize?: number;
	align?: "left" | "center" | "right";
}

const TextEntity: React.FC<TextEntityProps> = ({
	uid,
	text,
	fontSize = 14,
	align = "center",
}) => {
	return (
		<div
			data-entity-uid={uid}
			style={{
				padding: "8px",
				textAlign: align,
				wordBreak: "break-word",
				fontSize: `${fontSize}px`,
				color: "#333",
			}}
		>
			{text}
		</div>
	);
};

export default TextEntity;
