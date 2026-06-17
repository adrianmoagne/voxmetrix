import { Pages } from "@/@types";

/** Participant URL for the deployment the user is currently on (preview or production). */
export const buildParticipantShareUrl = (experimentId: string): string => {
	const path = Pages.ExperimentParticipant.replace(":id", experimentId);
	return `${window.location.origin}${path}`;
};

export const downloadJson = (data: unknown, filename: string) => {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};
