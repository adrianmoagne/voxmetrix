import S from "./ButtonSwitch.styles";

type Props = {
	activeKey?: string;
	buttons?: {
		label: string;
		key: string;
	}[];
	onClick?: (key: string) => void;
};

const ButtonSwitch: React.FC<Props> = ({ activeKey, buttons = [], onClick }) => {
	const isActive = (v: string) => {
		if (!activeKey) return false;
		return v === activeKey;
	};

	return (
		<S.Wrapper>
			{buttons.map((button) => (
				<S.Button
					onClick={() => onClick?.(button.key)}
					key={button.key}
					isActive={isActive(button.key)}
				>
					{button.label}
				</S.Button>
			))}
		</S.Wrapper>
	);
};

export default ButtonSwitch;
