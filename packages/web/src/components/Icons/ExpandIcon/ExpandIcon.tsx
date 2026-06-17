import { useTheme } from "@leux/ui";
import type { IconProps } from "../Icons";
import { useMemo } from "react";

const ExpandIcon: React.FC<IconProps> = ({
	width = 20,
	height = 20,
	strokeWidth,
	twoTone = true,
	twoToneOpacity = 0.2,
	twoToneColor = "primary",
	colorScheme = "primary",
}) => {
	const { theme } = useTheme();

	const colorValue = useMemo(() => theme && theme[colorScheme], [theme, colorScheme]);
	const twoToneColorValue = useMemo(
		() => (twoTone && twoToneColor && theme ? theme[twoToneColor] : "transparent"),
		[theme, twoTone, twoToneColor]
	);

	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5Z"
					fill={twoToneColorValue}
					fillOpacity={twoToneOpacity}
					stroke={colorValue}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M7.91675 17.5V2.5"
					stroke={colorValue}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M4.58325 8.33325L6.04159 9.99992L4.58325 11.6666"
					stroke={colorValue}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</svg>
	);
};

export default ExpandIcon;
