export const shouldForwardProp: (prop: string) => boolean = (prop) =>
	!["isActive", "isCollapsed", "isClickable"].includes(prop);
