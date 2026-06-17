import type { StoreDispatch, StoreState } from "@/store";
import { mediaUploadActions } from "@/store";
import { Typography } from "@leux/ui";
import { Upload } from "react-feather";
import { useDispatch, useSelector } from "react-redux";
import S from "../UploadModal.styles";
import { X } from "react-feather";
import { type IUploadFile } from "@/@types";

const UploadStep: React.FC = () => {
	// const { LL } = useI18nContext();
	const dispatch = useDispatch<StoreDispatch>();
	const { files } = useSelector((state: StoreState) => state.mediaUpload);
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		const filesToUpload: IUploadFile[] = files.map((file) => ({
			fileName: file.name,
			file,
			progress: 0,
			status: "pending",
		}));

		dispatch(mediaUploadActions.uploadFiles(filesToUpload));
	};

	return (
		<S.Container>
			<S.DropZone>
				<Upload size={24} />
				<Typography variant="body-2" textColor="placeholder">
					Click or drop files here to upload.
				</Typography>
				<S.FileInput
					type="file"
					multiple
					accept="audio/*,image/*"
					onChange={handleFileChange}
				></S.FileInput>
			</S.DropZone>
			<Typography variant="caption" textColor="placeholder" textAlign="end">
				Accepted formats jpeg, mp3, png
			</Typography>

			{files.length > 0 && (
				<S.FileList>
					<Typography variant="subtitle-2" textColor="textOne">
						Filelist
					</Typography>
					{files.map((file) => (
						<S.FileItem key={file.fileName}>
							<Typography variant="body-2" textColor="placeholder">
								{file.fileName}
							</Typography>
							<X
								size={20}
								style={{ cursor: "pointer" }}
								onClick={() => dispatch(mediaUploadActions.removeFile(file))}
							/>
						</S.FileItem>
					))}
				</S.FileList>
			)}
		</S.Container>
	);
};

export default UploadStep;
