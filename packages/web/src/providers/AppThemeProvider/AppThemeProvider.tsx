import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import React from "react";

import { shadows } from "@/styles";
import { OverlayProvider, useTheme } from "@leux/ui";

interface AppThemeProviderProps {
	children?: React.ReactNode;
}

const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
	const { theme } = useTheme();

	return (
		<EmotionThemeProvider theme={{ main: theme, shadows }}>
			<OverlayProvider>{children}</OverlayProvider>
		</EmotionThemeProvider>
	);
};

export { AppThemeProvider };
