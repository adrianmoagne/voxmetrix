import type { IMedia } from "@/@types";
import { Typography } from "@leux/ui";
import { format } from "date-fns";
import { Headphones, Image } from "react-feather";
import BorderCard from "../BorderCard/BorderCard";
import S from "./MediaCard.styles";
import { formatFileSize } from "@/utils";

type Props = {
	media: IMedia;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	width?: number;
	height?: number;
};

export const MEDIA_CARD_SIZE = 180;

const MediaCard: React.FC<Props> = ({
	media,
	onClick,
	width = MEDIA_CARD_SIZE,
	height = MEDIA_CARD_SIZE,
}) => {
	return (
		<BorderCard
			width={width}
			height={height}
			justifyContent="space-between"
			alignItems="flex-start"
			onClick={onClick}
			style={{
				padding: "12px",
			}}
		>
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
				#{media._id}
			</Typography>
			<S.Info>
				{media.type === "picture" && (
					<Image width={48} height={48} strokeWidth={1} className="icon" />
				)}
				{media.type === "audio" && (
					<Headphones width={48} height={48} strokeWidth={1} className="icon" />
				)}
				<S.Filename>
					<Typography variant="body-2">{media.filename}</Typography>
				</S.Filename>
				<S.Row>
					<Typography textColor="placeholder" variant="caption">
						{formatFileSize(media.size)} KB
					</Typography>
					<Typography textColor="placeholder" variant="caption">
						{format(new Date(media.createdAt), "dd/MM/yy")}
					</Typography>
				</S.Row>
			</S.Info>
		</BorderCard>
	);
};

export default MediaCard;
