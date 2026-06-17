import { ThemeProvider as LeuxThemeProvider } from "@leux/ui";
import { useCallback, useEffect, useState } from "react";
import { Provider as StoreProvider } from "react-redux";
import { RouterProvider } from "react-router";
import { LocalStorageKeys } from "./@types";
import TypesafeI18n from "./i18n/i18n-react";
import type { Locales } from "./i18n/i18n-types";
import { baseLocale, detectLocale } from "./i18n/i18n-util";
import { loadLocaleAsync } from "./i18n/i18n-util.async";
import { leuxGlobalConfig } from "./leuxConfig";
import { AppThemeProvider, SearchProvider } from "./providers";
import router from "./router";
import store from "./store/store";
import { darkTheme, lightTheme } from "./styles";
import "./styles/GlobalStyles";

const App: React.FC = () => {
	const [locale, setLocale] = useState<Locales | null>(null);
	const getPersistedLocale = useCallback(() => {
		const persistedLocale = localStorage.getItem(LocalStorageKeys.I18NLocale) || baseLocale;
		const detectedLocale = detectLocale(() => [persistedLocale]);
		const locale = detectedLocale;

		loadLocaleAsync(locale).then(() => {
			setLocale(locale);
		});
	}, []);

	useEffect(() => {
		getPersistedLocale();
	}, [getPersistedLocale]);

	if (!locale) {
		return <div>loading translations...</div>;
	}

	return (
		<StoreProvider store={store}>
			<TypesafeI18n locale={locale}>
				<LeuxThemeProvider
					themes={{
						light: lightTheme,
						dark: darkTheme,
					}}
					globalConfig={leuxGlobalConfig}
				>
					<AppThemeProvider>

						<SearchProvider>
							<RouterProvider router={router} />

						</SearchProvider>
					</AppThemeProvider>
				</LeuxThemeProvider>
			</TypesafeI18n>
		</StoreProvider>
	);
};

export default App;
