import { ModalId, ModalSizes, type IMedia, type IMediaFilters } from "@/@types";
import { MediaCard, Modals } from "@/components";
import { useI18nContext } from "@/i18n/i18n-react";
import { mediaViewerActions, type StoreDispatch, type StoreState } from "@/store";
import { Badge, Box, Button, Typography, useModal } from "@leux/ui";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import S from "./Medias.styles";
const Media: React.FC = () => {
	const { LL } = useI18nContext();
	const { createModal } = useModal();
	const { medias, filters } = useSelector((state: StoreState) => state.mediaViewer);
	const [filteredMedias, setFilteredMedias] = useState<IMedia[]>([]);

	const dispatch = useDispatch<StoreDispatch>();

	const loadMedias = useCallback(() => {
		dispatch(mediaViewerActions.fetchMedias());
	}, [dispatch]);

	useEffect(() => {
		loadMedias();
	}, [loadMedias]);

	useEffect(() => {
		setFilteredMedias(medias);
	}, [medias]);

	const openMediaViewer = (media: IMedia, index: number) => {
		dispatch(mediaViewerActions.setMedia({ media, index }));

		createModal({
			id: ModalId.MediaViewer,
			title: LL.Modals.MediaViewer.Title(),
			children: <Modals.MediaViewerModal.Content />,
			customFooter: <Modals.MediaViewerModal.Footer />,
			width: ModalSizes.MediaViewer,
		});
	};

	const openUploadModal = () => {
		createModal({
			id: ModalId.Upload,
			title: LL.Buttons.Upload(),
			children: <Modals.UploadModal.Content />,
			customFooter: <Modals.UploadModal.Footer />,
			width: ModalSizes.Upload,
		});
	};

	const handleSetFilters = (filters: IMediaFilters) => {
		dispatch(mediaViewerActions.setFilters(filters));
	};

	const applyAndFilterMedias = (filter: IMediaFilters) => {
		const filteredMedias = medias.filter((media) => {
			if (!filter.type) {
				return media;
			}

			if (filter.type === "audio" && media.type === "audio") {
				return media;
			}

			if (filter.type === "picture" && media.type === "picture") {
				return media;
			}

			return false;
		});
		setFilteredMedias(filteredMedias);
	};

	useEffect(() => {
		if (filters) {
			applyAndFilterMedias(filters);
		}
	}, [filters?.type]);

	return (
		<S.Container>
			<S.Header>
				<Box flex flexDirection="row" justifyContent="space-between" alignItems="center">
					<Typography textColor="textOne" variant="h3">
						{LL.Medias.Title()}
					</Typography>
					<Button colorScheme="primary" onClick={openUploadModal}>
						{LL.Buttons.Upload()}
					</Button>
				</Box>
				<Typography textColor="placeholder" variant="caption">
					{LL.Medias.Subtitle()}
				</Typography>
			</S.Header>
			<S.Filters>
				<Badge
					variant="filled"
					clickable
					colorScheme={!filters?.type ? "secondary" : "default"}
					size="large"
					onClick={() => handleSetFilters({ type: undefined })}
				>
					{LL.Medias.Filters.All()}
				</Badge>
				<Badge
					clickable
					size="large"
					variant="filled"
					colorScheme={filters?.type === "audio" ? "secondary" : "default"}
					onClick={() => handleSetFilters({ type: "audio" })}
				>
					{LL.Medias.Filters.Audio()}
				</Badge>
				<Badge
					clickable
					size="large"
					variant="filled"
					colorScheme={filters?.type === "picture" ? "secondary" : "default"}
					onClick={() => handleSetFilters({ type: "picture" })}
				>
					{LL.Medias.Filters.Image()}
				</Badge>
				<Badge clickable size="large">
					{LL.Medias.Filters.InUse()}
				</Badge>
			</S.Filters>
			<S.Grid>
				{filteredMedias.length === 0 &&
					medias.map((media, index) => (
						<MediaCard
							key={media._id}
							media={media}
							onClick={() => openMediaViewer(media, index)}
						/>
					))}
				{filteredMedias.length > 0 &&
					filteredMedias.map((media, index) => (
						<MediaCard
							key={media._id}
							media={media}
							onClick={() => openMediaViewer(media, index)}
						/>
					))}
			</S.Grid>
		</S.Container>
	);
};

export default Media;
