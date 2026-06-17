import React from "react";
import S from "./IconButton.styles";
import type { LeColorScheme } from "@leux/ui";

interface IconButtonProps {
	children?: React.ReactNode;
	icon?: React.ReactNode;
	onClick?: (e: React.MouseEvent) => void;
	disabled?: boolean;
	styles?: React.CSSProperties;
	className?: string;
	onlyIcon?: boolean;
	fillIcon?: boolean;
	colorScheme?: LeColorScheme;
}

const IconButton: React.FC<IconButtonProps> = ({
	colorScheme = "primary",
	className,
	icon,
	children,
	...props
}) => {
	return (
		<S.Button className={"le-text-button" + (className || "")} colorScheme={colorScheme} {...props}>
			{(icon || props.onlyIcon) && <span className="icon">{props.onlyIcon ? children : icon}</span>}
			{!props.onlyIcon && children}
		</S.Button>
	);
};

export default IconButton;
