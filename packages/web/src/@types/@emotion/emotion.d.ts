import {} from "@emotion/react";
import type { LeThemeType } from "@leux/ui";
import type { Shadows } from "../../styles";
declare module "@emotion/react" {
	export interface Theme {
		main: LeThemeType & MainColors & GhostColors;
		shadows: Shadows;
	}
}
