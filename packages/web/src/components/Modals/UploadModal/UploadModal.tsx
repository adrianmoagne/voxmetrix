// import { useI18nContext } from "@/i18n/i18n-react";
// // import type { StoreState } from "@/store";
// import { Badge, Box, Typography } from "@leux/ui";
// import React from "react";
// import { useSelector } from "react-redux";
// import BorderCard from "../../BorderCard/BorderCard";

import type { StoreState } from "@/store";
import { UploadModalFooter } from "./UploadModalFooter";
import UploadSteps from "./UploadSteps";
import { useSelector } from "react-redux";

const Content: React.FC = () => {
	// const { LL } = useI18nContext();
	const { step } = useSelector((state: StoreState) => state.mediaUpload);

	return (
		<>
			{step === "upload" && <UploadSteps.UploadStep />}
			{step === "sending" && <UploadSteps.SendingStep />}
			{step === "review" && <UploadSteps.ReviewStep />}
		</>
	);
};

const UploadModal = {
	Content,
	Footer: UploadModalFooter,
};

export default UploadModal;
