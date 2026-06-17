import type { LeThemeType } from "@leux/ui";
import { percent2HexFn } from "./percent2Hex";

export const main: Record<string, string> = {
	primary: "#5D69D9",
	secondary: "#8CA9D5",
	tertiary: "#4F5486",
	success: "#70C1B3",
	danger: "#F25F5C",
	warning: "#FFD166",
	black: "#3A3A3A",
	white: "#FFFFFF",
	disabled: "#ACACAC",
};

export const ghost: Record<string, string> = {
	primaryGhost: percent2HexFn(main.primary, 20),
	secondaryGhost: percent2HexFn(main.secondary, 20),
	tertiaryGhost: percent2HexFn(main.tertiary, 20),
	successGhost: percent2HexFn(main.success, 20),
	dangerGhost: percent2HexFn(main.danger, 20),
	warningGhost: percent2HexFn(main.warning, 20),
	blackGhost: percent2HexFn(main.black, 20),
	whiteGhost: percent2HexFn(main.white, 20),
};

export type MainColors = typeof main;
export type GhostColors = typeof ghost;

export const shadows = {
	soft: "0px 2px 3px rgba(0, 0, 0, 0.05)",
	strong: "0px 2px 6px rgba(0, 0, 0, 0.2)",
	sidebar: "2px 0px 3px rgba(0, 0, 0, 0.05)",
	modal: "",
};

export type Shadows = typeof shadows;

export const lightTheme: LeThemeType = {
	default: "#D2D9E5",
	defaultGhost: percent2HexFn("#D2D9E5", 20),
	inputBackground: "#F1F3F7",
	backgroundOne: "#FFFFFF",
	backgroundTwo: "#F8F8F8",
	backgroundThree: "#D9D9D9",
	textOne: "#1B2140",
	textTwo: "#514F62",
	textThree: "#616377",
	border: "#E1E2E4",
	placeholder: "#989BA7",
	...main,
	...ghost,
};

export const darkTheme: LeThemeType = {
	default: "#626266",
	defaultGhost: percent2HexFn("#626266", 20),
	inputBackground: "#414245",
	backgroundOne: "#262629",
	backgroundTwo: "#2D2D30",
	backgroundThree: "#3B3B41",
	textOne: "#FFFFFF",
	textTwo: "#D1D1D7",
	textThree: "#969699",
	border: "#43444A",
	placeholder: "#989BA7",
	...main,
	...ghost,
};
