import type { LeGlobalConfig } from "@leux/ui";

export const leuxGlobalConfig: LeGlobalConfig = {
	styling: { fontFamily: "Montserrat, sans-serif" },
	typography: {
		textColor: "textOne",
	},
	button: {
		customStyles: {
			padding: "12px 24px",
			borderRadius: "6px",
		},
	},
	input: {
		customStyles: {
			borderRadius: "6px",
			fontWeight: "400",
			alignSelf: "stretch",
			width: "100%",
		},
	},
	textarea: {
		customStyles: {
			borderRadius: "6px",
			fontWeight: "400",
		},
	},
};
