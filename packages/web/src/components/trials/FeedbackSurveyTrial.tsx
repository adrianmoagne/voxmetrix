import { useState } from "react";
import { Button, Radio, Typography } from "@leux/ui";

interface SurveyQuestion {
	prompt: string;
	name: string;
	labels: string[];
}

interface FeedbackSurveyTrialProps {
	questions?: SurveyQuestion[];
	onComplete: (response: Record<string, string>) => void;
}

const FeedbackSurveyTrial: React.FC<FeedbackSurveyTrialProps> = ({ questions = [], onComplete }) => {
	const [responses, setResponses] = useState<Record<string, string>>({});

	const handleChange = (name: string, value: string) => {
		setResponses((prev) => ({ ...prev, [name]: value }));
	};

	const allAnswered = questions.every((q) => responses[q.name] !== undefined);

	const handleSubmit = () => {
		if (!allAnswered) return;
		onComplete(responses);
	};

	return (
		<div
			style={{
				maxWidth: 700,
				margin: "0 auto",
				padding: 40,
				display: "flex",
				flexDirection: "column",
				gap: 32,
			}}
		>
			<div style={{ textAlign: "center" }}>
				<Typography variant="h3">Feedback</Typography>
			</div>

			{questions.map((q) => (
				<div key={q.name}>
					<div style={{ marginBottom: 12 }}>
						<Typography variant="body-1">{q.prompt}</Typography>
					</div>
					<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
						{q.labels.map((label) => (
							<Radio
								key={label}
								fieldKey={q.name}
								value={label}
								label={label}
								defaultChecked={responses[q.name] === label}
								onChange={() => handleChange(q.name, label)}
							/>
						))}
					</div>
				</div>
			))}

			<div style={{ textAlign: "center", marginTop: 16 }}>
				<Button
					colorScheme="primary"
					onClick={handleSubmit}
					state={{ disabled: !allAnswered }}
				>
					Submit
				</Button>
			</div>
		</div>
	);
};

export default FeedbackSurveyTrial;
