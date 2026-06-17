// import { useI18nContext } from "@/i18n/i18n-react";
import { Box, Button, useModal } from "@leux/ui";
// import React, { useEffect } from "react";
import { ModalId } from "@/@types";
import type { StoreDispatch, StoreState } from "@/store";
import { mediaUploadActions, mediaViewerActions } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import S from "./UploadModal.styles";

const UploadModalFooter: React.FC = () => {
	// const { LL } = useI18nContext();
	const { step, files } = useSelector((state: StoreState) => state.mediaUpload);
	// const { medias } = useSelector((state: StoreState) => state.mediaViewer);
	const dispatch = useDispatch<StoreDispatch>();
	const { closeModal } = useModal();

	const handleContinue = () => {
		if (step === "upload" && files.length > 0) {
			dispatch(mediaUploadActions.setStep("sending"));
		}

		if (step === "review" && files.length > 0) {
			// const newMedias = files.map((uploadFile) => ({
			// 	_id: Math.random().toString(),
			// 	type: uploadFile.file.type.startsWith("audio") ? "audio" : "image",
			// 	fileName: uploadFile.fileName,
			// 	size: uploadFile.file.size,
			// 	url: URL.createObjectURL(uploadFile.file),
			// 	extension: uploadFile.fileName.split(".").pop(),
			// 	created_at: new Date(),
			// }));
			// dispatch(mediaViewerActions.initMediaViewer([...medias, ...newMedias] as IMedia[]));
			dispatch(mediaViewerActions.fetchMedias());
			dispatch(mediaUploadActions.reset());
			closeModal(ModalId.Upload);
		}
	};
	const handleCancel = () => {
		if (step === "upload") {
			closeModal(ModalId.Upload);
		}

		if (step === "sending") {
			dispatch(mediaUploadActions.setStep("upload"));
		}

		if (step === "review") {
			dispatch(mediaUploadActions.reset());
		}
	};

	return (
		<S.FooterRow>
			{step === "upload" && (
				<Box flex flexDirection="row" alignItems="end" flexGap={12}>
					<Button onClick={handleCancel}>Close</Button>
					<Button
						colorScheme="primary"
						onClick={handleContinue}
						state={{ disabled: files.length === 0 }}
					>
						Continue
					</Button>
				</Box>
			)}
			{step === "sending" && (
				<Box flex flexDirection="row" alignItems="end" flexGap={12}>
					<Button onClick={handleCancel}>Back</Button>
				</Box>
			)}
			{step === "review" && (
				<Box flex flexDirection="row" alignItems="end" flexGap={12}>
					<Button onClick={handleCancel}>Upload more files</Button>
					<Button
						colorScheme="primary"
						onClick={handleContinue}
						state={{ disabled: files.length === 0 }}
					>
						Finish
					</Button>
				</Box>
			)}
		</S.FooterRow>
	);
};

export { UploadModalFooter };
