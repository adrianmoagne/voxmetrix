import { Typography } from "@leux/ui";
import { useMemo } from "react";
import { useLocation } from "react-router";

import S from "./Breadcrumbs.styles";
import { ChevronRight } from "react-feather";
import { useI18nContext } from "@/i18n/i18n-react";
import type { Translation } from "@/i18n/i18n-types";

const Breadcrumbs: React.FC = () => {
	const { pathname } = useLocation();

	const splittedPath: (keyof typeof LL.Breadcrumbs)[] = useMemo(() => {
		return pathname
			.split("/")
			.filter((path) => path !== "") as (keyof Translation["Breadcrumbs"])[];
	}, [pathname]);

	const { LL } = useI18nContext();

	return (
		<S.Wrapper>
			{splittedPath.map((path, index, arr) => (
				<S.Item key={path}>
					<Typography
						textColor="placeholder"
						customStyles={{
							fontSize: "12px",
							fontWeight: "500",
						}}
					>
						{LL.Breadcrumbs[path]()}
					</Typography>
					{arr.length > index + 1 && <ChevronRight size={12} strokeWidth={2} />}
				</S.Item>
			))}
		</S.Wrapper>
	);
};

export default Breadcrumbs;
