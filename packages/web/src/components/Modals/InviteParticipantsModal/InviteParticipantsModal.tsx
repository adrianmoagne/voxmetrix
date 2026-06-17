import { useEffect, useState } from "react";
import S from "./InviteParticipantsModal.styles";
import { Button, Input, Typography } from "@leux/ui";
import { buildParticipantShareUrl } from "@/utils";

interface InviteParticipantsModalProps {
	experimentId: string;
	experimentName: string;
	onClose?: () => void;
}

const Content: React.FC<InviteParticipantsModalProps> = ({
	experimentId,
	experimentName,
	onClose,
}) => {
	const [shareUrl, setShareUrl] = useState("");
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!experimentId) {
			setShareUrl("");
			setError("Missing experiment id.");
			return;
		}

		setShareUrl(buildParticipantShareUrl(experimentId));
		setError(null);
	}, [experimentId]);

	const handleCopy = async () => {
		if (!shareUrl) return;

		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy share link:", err);
			setError("Failed to copy link. Select the link and copy it manually.");
		}
	};

	const handleOpen = () => {
		if (shareUrl) {
			window.open(shareUrl, "_blank", "noopener,noreferrer");
		}
	};

	return (
		<S.Container>
			<Typography variant="body-2">Share "{experimentName}" with participants</Typography>

			<S.InputWrapper>
				<Typography variant="caption">
					Copy this link and send it through email, chat, or any other channel.
				</Typography>
				<Input
					placeholder={shareUrl ? undefined : "Share link unavailable"}
					inputProps={{
						value: shareUrl,
						readOnly: true,
						onFocus: (event) => event.currentTarget.select(),
					}}
				/>
				{error && (
					<Typography variant="caption" customStyles={{ color: "red" }}>
						{error}
					</Typography>
				)}
			</S.InputWrapper>

			{copied && (
				<S.ResultMessage variant="success">Link copied to clipboard.</S.ResultMessage>
			)}

			<S.FooterRow>
				{onClose && (
					<Button colorScheme="secondary" onClick={onClose}>
						Close
					</Button>
				)}
				<Button colorScheme="secondary" onClick={handleOpen} state={{ disabled: !shareUrl }}>
					Open Link
				</Button>
				<Button colorScheme="primary" onClick={handleCopy} state={{ disabled: !shareUrl }}>
					{copied ? "Copied" : "Copy Link"}
				</Button>
			</S.FooterRow>
		</S.Container>
	);
};

const InviteParticipantsModal = {
	Content,
};

export default InviteParticipantsModal;
