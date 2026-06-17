import S from "./BorderCard.styles";

type Props = {
	width?: React.CSSProperties["width"];
	height?: React.CSSProperties["height"];
	gap?: React.CSSProperties["gap"];
	justifyContent?: React.CSSProperties["justifyContent"];
	alignItems?: React.CSSProperties["alignItems"];
} & React.HTMLAttributes<HTMLDivElement>;

const BorderCard: React.FC<Props> = ({
	children,
	gap,
	justifyContent,
	alignItems,
	width,
	height,
	style,
	...rest
}) => {
	return (
		<S.Container
			isClickable={!!rest.onClick}
			style={{ gap, justifyContent, width, minWidth: width, alignItems, height, ...style }}
			{...rest}
		>
			{children}
		</S.Container>
	);
};

export default BorderCard;
