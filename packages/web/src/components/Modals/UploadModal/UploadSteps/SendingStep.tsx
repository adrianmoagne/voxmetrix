import type { IUploadFileStatus } from "@/@types";
import { mediaUploadActions, type StoreState } from "@/store";
import { Progress, Typography, type ProgressColorScheme } from "@leux/ui";
import { useEffect } from "react";
import { Image } from "react-feather";
import { useDispatch, useSelector } from "react-redux";
import store from "../../../../store/store";
import BorderCard from "../../../BorderCard/BorderCard";
import S from "./SendingSteps.styles";
import { MediaService } from "@/api/services/MediaService";

const SendingStep: React.FC = () => {
	// const { LL } = useI18nContext();
	const { files } = useSelector((state: StoreState) => state.mediaUpload);
	const dispatch = useDispatch();

	const getColorScheme = (progress: number, status: IUploadFileStatus): ProgressColorScheme => {
		if (progress === 100 && status === "completed") return "success";
		if (progress === 100 && status === "failed") return "danger";

		return "primary";
	};

	useEffect(() => {
		const uploadFiles = async () => {
			const formData = new FormData();

			files.forEach((file) => {
				if (file.status === "completed" || file.status === "failed") return;
				formData.append("files", file.file);
			});

			try {
				MediaService.uploadMedia(formData, (progressEvent) => {
					if (!progressEvent.total) return;
					const totalProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);

					// Update each file's progress
					const updatedFiles = store.getState().mediaUpload.files.map((file) => {
						if (file.status === "completed" || file.status === "failed") return file;
						return {
							...file,
							progress: totalProgress,
							status: totalProgress === 100 ? "completed" : ("uploading" as IUploadFileStatus),
						};
					});
					dispatch(mediaUploadActions.setFiles(updatedFiles));
				});
			} catch (error) {
				console.error("Error during upload process:", error);
			}
		};
		uploadFiles();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// check progress changes
	useEffect(() => {
		const allCompleted = files.every(
			(file) => file.status === "completed" || file.status === "failed"
		);

		if (allCompleted) {
			dispatch(mediaUploadActions.setStep("review"));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [files]);

	return (
		<S.Container>
			<Typography variant="body-2" textColor="placeholder">
				Wait till upload ends..
			</Typography>
			{files.map((file) => (
				<BorderCard
					key={file.fileName}
					width="100%"
					height="81px"
					style={{ borderRadius: "6px", flexDirection: "row", alignItems: "center" }}
					gap={12}
				>
					<Image size={32} />
					<S.Column>
						<Typography variant="body-2" textColor="textOne">
							{file.fileName}
						</Typography>
						<Progress
							progress={file.progress}
							colorScheme={getColorScheme(file.progress, file.status)}
						/>
					</S.Column>
				</BorderCard>
			))}
		</S.Container>
	);
};

export default SendingStep;
