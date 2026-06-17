import { useI18nContext } from "@/i18n/i18n-react";
import type { StoreState } from "@/store";
import { Badge, Box, Typography } from "@leux/ui";
import React from "react";
import { useSelector } from "react-redux";
import BorderCard from "../../BorderCard/BorderCard";
import S from "./MediaViewerModal.styles";
import { MediaViewerModalFooter } from "./MediaViewerModalFooter";
import { formatFileSize } from "@/utils";

const Content: React.FC = () => {
	const { LL } = useI18nContext();
	const { selectedMedia: media } = useSelector((state: StoreState) => state.mediaViewer);
	if (!media) {
		return null;
	}

	return (
		<S.Container>
			<S.Row>
				<BorderCard
					width="360px"
					height="100%"
					justifyContent={media.type === "picture" ? "flex-end" : "center"}
					alignItems="center"
				>
					{media.type === "picture" && <S.Image src={media.src}></S.Image>}
					{media.type === "audio" && (
						<audio controls controlsList="nodownload">
							<source src={media.src} type={`audio/${media.extension}`}></source>
							<span>Your browser does not support the audio tag.</span>
						</audio>
					)}
					<Typography variant="subtitle-2" textColor="textOne">
						{media.filename}
					</Typography>
				</BorderCard>
				<S.Details>
					<Typography variant="subtitle-2" textColor="textOne">
						{LL.Modals.MediaViewer.Details.Subtitle()}
					</Typography>
					<S.RowBetween>
						<Typography variant="caption" textColor="placeholder">
							{LL.Modals.MediaViewer.Details.Type()}
						</Typography>
						<Typography variant="button" textColor="textTwo">
							{media.type}
						</Typography>
					</S.RowBetween>
					<S.RowBetween>
						<Typography variant="caption" textColor="placeholder">
							{LL.Modals.MediaViewer.Details.Filename()}
						</Typography>
						<Typography variant="button" textColor="textTwo">
							{media.filename}
						</Typography>
					</S.RowBetween>
					<S.RowBetween>
						<Typography variant="caption" textColor="placeholder">
							{LL.Modals.MediaViewer.Details.Extension()}
						</Typography>
						<Typography variant="button" textColor="textTwo">
							{media.extension || "N/A"}
						</Typography>
					</S.RowBetween>
					<S.RowBetween>
						<Typography variant="caption" textColor="placeholder">
							{LL.Modals.MediaViewer.Details.Size()}
						</Typography>
						<Typography variant="button" textColor="textTwo">
							{formatFileSize(media.size)}
						</Typography>
					</S.RowBetween>
					<S.Column>
						<Typography variant="caption" textColor="placeholder">
							{LL.Modals.MediaViewer.Details.URL()}
						</Typography>
						<Typography
							variant="button"
							textColor="textTwo"
							customStyles={{
								wordBreak: "break-all",
							}}
						>
							{media.src}
						</Typography>
					</S.Column>
					{!!media.used_by && (
						<S.Column>
							<Typography variant="caption" textColor="placeholder">
								{LL.Modals.MediaViewer.Details.UsedIn()}
							</Typography>
							<Box flex flexDirection="row" flexGap={6} flexWrap="wrap">
								{media.used_by?.map((usedBy, index) => (
									<Badge
										variant="ghost"
										colorScheme="secondary"
										customStyles={{
											width: "fit-content",
										}}
										key={index}
									>
										{usedBy}
									</Badge>
								))}
							</Box>
						</S.Column>
					)}
				</S.Details>
			</S.Row>
		</S.Container>
	);
};

const MediaViewerModal = {
	Content,
	Footer: MediaViewerModalFooter,
};

export default MediaViewerModal;
