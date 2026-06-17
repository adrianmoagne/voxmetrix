interface ImageEntityProps {
	uid: string;
	imageSrc: string;
	alt?: string;
	trackingTargetId?: string;
}

const ImageEntity: React.FC<ImageEntityProps> = ({
	uid,
	imageSrc,
	alt = "",
	trackingTargetId,
}) => {
	return (
		<img
			id={trackingTargetId ? `target-${trackingTargetId}` : undefined}
			data-entity-uid={uid}
			src={imageSrc}
			alt={alt}
			style={{
				maxWidth: "100%",
				maxHeight: "100%",
				objectFit: "contain",
				borderRadius: "4px",
			}}
		/>
	);
};

export default ImageEntity;
