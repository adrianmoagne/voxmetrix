import { useDispatch, useSelector } from "react-redux";
import S from "./MediaGalleryModal.styles";
import { ModalId } from "@/@types";
import type { StoreState } from "src/store/store";
import { BorderCard } from "@/components";
import { Headphones, Image } from "react-feather";
import { Typography, useModal } from "@leux/ui";
import { MediaGalleryModalFooter } from "./MediaGalleryModalFooter";
import { format } from "date-fns";
import { addItemActions, mediaViewerActions, type StoreDispatch } from "@/store";
import { type IMedia } from "@/@types";
import { useEffect } from "react";

const Content = () => {
	const dispatch = useDispatch<StoreDispatch>();

	const { medias } = useSelector((state: StoreState) => state.mediaViewer);
	const { closeModal } = useModal();

	useEffect(() => {
		dispatch(mediaViewerActions.fetchMedias());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleOnClick = (media: IMedia) => {
		dispatch(addItemActions.setDraftMedia(media));
		dispatch(addItemActions.setDraftType("media"));
		closeModal(ModalId.MediaGallery);
	};
	return (
		<S.Container>
			{medias.map((media) => (
				<BorderCard
					key={media._id}
					width={160}
					height={120}
					onClick={() => handleOnClick(media)}
					style={{ padding: "12px" }}
				>
					<S.Info>
						<S.Row>
							<Typography
								variant="overline"
								textColor="secondary"
								customStyles={{
									wordBreak: "break-word",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									maxWidth: "136px",
								}}
							>
								{media.size}
							</Typography>
							<Typography
								variant="overline"
								textColor="secondary"
								customStyles={{
									wordBreak: "break-word",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									maxWidth: "136px",
								}}
							>
								{format(new Date(media.createdAt), "dd/MM/yy")}
							</Typography>
						</S.Row>
						{media.type === "picture" && (
							<Image width={48} height={48} strokeWidth={1} className="icon" />
						)}
						{media.type === "audio" && (
							<Headphones width={48} height={48} strokeWidth={1} className="icon" />
						)}
						<Typography
							customStyles={{
								wordBreak: "break-word",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								maxWidth: "136px",
							}}
						>
							{media.filename}
						</Typography>
					</S.Info>
				</BorderCard>
			))}
		</S.Container>
	);
};

const MediaGalleryModal = {
	Content,
	Footer: MediaGalleryModalFooter,
};

export default MediaGalleryModal;
