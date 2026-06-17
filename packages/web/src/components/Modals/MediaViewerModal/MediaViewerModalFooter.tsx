import { useI18nContext } from "@/i18n/i18n-react";
import { mediaViewerActions, type StoreDispatch, type StoreState } from "@/store";
import { Box, Typography } from "@leux/ui";
import React from "react";
import { ArrowLeft, ArrowRight, Download, Trash2 } from "react-feather";
import { useDispatch, useSelector } from "react-redux";
import IconButton from "../../IconButton/IconButton";
import S from "./MediaViewerModal.styles";

const MediaViewerModalFooter: React.FC = () => {
	const { LL } = useI18nContext();
	const { selectedMedia, selectedIndex, medias } = useSelector(
		(state: StoreState) => state.mediaViewer
	);
	const dispatch = useDispatch<StoreDispatch>();

	const goTo = (index: number) => {
		const media = medias[index + selectedIndex];

		if (media) {
			dispatch(mediaViewerActions.setMedia({ media, index: index + selectedIndex }));
		}
	};

	const onDownload = () => { };
	const onDelete = () => { };



	return (
		<S.FooterRow>
			<Box flex flexDirection="row" flexGap={12}>
				<IconButton onlyIcon onClick={() => goTo(-1)} disabled={selectedIndex - 1 < 0}>
					<ArrowLeft size={16} />
				</IconButton>
				<Box flex flexDirection="row" flexGap={6} alignItems="center">
					<Typography
						variant="button"
						textColor="primary"
						customStyles={{
							textDecoration: "underline",
						}}
					>
						{selectedIndex + 1}
					</Typography>
					<Typography variant="button" textColor="placeholder">
						{LL.Modals.MediaViewer.Of({ total: medias.length })}
					</Typography>
				</Box>
				<IconButton onlyIcon disabled={selectedIndex + 1 >= medias.length} onClick={() => goTo(1)}>
					<ArrowRight size={16} />
				</IconButton>
			</Box>
			<Box flex flexDirection="row" alignItems="center" flexGap={12}>
				<IconButton
					colorScheme="primary"
					icon={<Download size={16} />}
					onClick={onDownload}
					fillIcon
				>
					{LL.Buttons.Download()}
				</IconButton>
				<IconButton
					colorScheme="danger"
					icon={<Trash2 size={16} />}
					onClick={onDelete}
					disabled={selectedMedia?.used_by !== undefined}
					fillIcon
				>
					{LL.Buttons.Delete()}
				</IconButton>
			</Box>
		</S.FooterRow>
	);
};

export { MediaViewerModalFooter };
