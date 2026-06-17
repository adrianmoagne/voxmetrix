import type { StoreState } from "@/store";
import { Typography } from "@leux/ui";
import { useSelector } from "react-redux";
import S from "./SendingSteps.styles";
import BorderCard from "../../../BorderCard/BorderCard";
import { Image } from "react-feather";
import { Progress } from "@leux/ui";
const ReviewStep: React.FC = () => {
	// const { LL } = useI18nContext();
	const { files } = useSelector((state: StoreState) => state.mediaUpload);
	return (
		<S.Container>
			<Typography variant="body-2" textColor="placeholder">
				Review your uploads
			</Typography>
			{files.map((file) => (
				<BorderCard
					width="100%"
					height="81px"
					style={{ borderRadius: "6px", flexDirection: "row", alignItems: "center" }}
					gap={12}
					key={file.fileName}
				>
					<Image size={32} />
					<S.Column>
						<Typography variant="body-2">{file.fileName}</Typography>
						<Progress progress={100} colorScheme="success" />
					</S.Column>
				</BorderCard>
			))}
		</S.Container>
	);
};

export default ReviewStep;
