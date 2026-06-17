import type { LeThemeType } from "@leux/ui";
import CollapseIcon from "./CollapseIcon/CollapseIcon";
import ExpandIcon from "./ExpandIcon/ExpandIcon";

export interface IconProps {
	width?: string;
	height?: string;
	twoTone?: boolean;
	twoToneOpacity?: number;
	twoToneColor?: keyof LeThemeType;
	strokeWidth?: string;
	colorScheme?: keyof LeThemeType;
}

const Icons = {
	CollapseIcon,
	ExpandIcon,
};

export default Icons;
