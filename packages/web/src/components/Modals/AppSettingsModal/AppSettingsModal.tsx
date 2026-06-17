import { LocalesArr, LocalStorageKeys } from "@/@types";
import { useI18nContext } from "@/i18n/i18n-react";
import { detectLocale } from "@/i18n/i18n-util";
import { loadLocaleAsync } from "@/i18n/i18n-util.async";
import { Select, Typography, useTheme } from "@leux/ui";
import React from "react";
import S from "./AppSettingsModal.styles";

const AppSettingsModal: React.FC = () => {
	const { LL, setLocale, locale } = useI18nContext();
	const { currentTheme, swap } = useTheme();

	const changeLanguage = (newLocale: string) => {
		localStorage.setItem(LocalStorageKeys.I18NLocale, newLocale);

		const detectedLocale = detectLocale(() => [newLocale]);
		const locale = detectedLocale;

		loadLocaleAsync(locale).then(() => {
			setLocale(locale);
		});
	};

	return (
		<S.Container>
			<S.RowBetween>
				<S.Group>
					<Typography variant="body-2" textColor="textOne">
						{LL.Modals.AppSettings.Language()}
					</Typography>
					<Typography variant="caption" textColor="placeholder">
						{LL.Modals.AppSettings.ChangeLanguage()}
					</Typography>
				</S.Group>
				<Select
					variant="outlined"
					width={140}
					fieldKey="language"
					onChange={(e) => changeLanguage(e.target.value)}
					selectProps={{
						value: locale,
					}}
				>
					{LocalesArr.map((locale) => (
						<option key={locale.value} value={locale.value}>
							{locale.label}
						</option>
					))}
				</Select>
			</S.RowBetween>
			<S.Divider />
			<S.Group>
				<Typography variant="body-2" textColor="textOne">
					{LL.Modals.AppSettings.Theme()}
				</Typography>
				<Typography variant="caption" textColor="placeholder">
					{LL.Modals.AppSettings.ChangeTheme()}
				</Typography>
			</S.Group>
			<S.Row>
				<S.SelectTheme isSelected={currentTheme === "light"} onClick={() => swap("light")}>
					<Typography customClass="theme-label" variant="button" textColor="textOne">
						{LL.Modals.AppSettings.Light()}
					</Typography>
					<S.ThemeImage src="/light_theme.svg" />
				</S.SelectTheme>
				<S.SelectTheme isSelected={currentTheme === "dark"} onClick={() => swap("dark")}>
					<Typography customClass="theme-label" variant="button" textColor="textOne">
						{LL.Modals.AppSettings.Dark()}
					</Typography>
					<S.ThemeImage src="/dark_theme.svg" />
				</S.SelectTheme>
			</S.Row>
		</S.Container>
	);
};

export default AppSettingsModal;
