import { Button } from "@leux/ui";
import { useScreenRuntime } from "../ScreenRuntimeContext";

interface ContinueButtonEntityProps {
	uid: string;
	label?: string;
}

const ContinueButtonEntity: React.FC<ContinueButtonEntityProps> = ({
	uid,
	label = "Continue",
}) => {
	const { isEntityInteractive, requestAdvance } = useScreenRuntime();
	const active = isEntityInteractive(uid);

	const handleClick = () => {
		if (!active) return;

		requestAdvance({
			reason: "continue-click",
			at: performance.now(),
		});
	};

	return (
		<div data-entity-uid={uid} style={{ textAlign: "center", padding: 16 }}>
			<Button
				colorScheme="primary"
				state={{ disabled: !active }}
				onClick={handleClick}
			>
				{label}
			</Button>
		</div>
	);
};

export default ContinueButtonEntity;
