import { Button } from "@leux/ui";

interface InstructionTrialProps {
	content: string;
	buttonText?: string;
	onComplete: (response: null) => void;
}

const InstructionTrial: React.FC<InstructionTrialProps> = ({
	content,
	buttonText = "Continue",
	onComplete,
}) => {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				padding: 40,
				textAlign: "center",
			}}
		>
			<div dangerouslySetInnerHTML={{ __html: content }} />
			<div style={{ marginTop: 24 }}>
				<Button colorScheme="primary" onClick={() => onComplete(null)}>
					{buttonText}
				</Button>
			</div>
		</div>
	);
};

export default InstructionTrial;
