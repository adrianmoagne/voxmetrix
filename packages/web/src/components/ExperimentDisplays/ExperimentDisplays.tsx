import { Typography } from "@leux/ui";
import S from "./ExperimentDisplays.styles";
import type { IScreen } from "@/@types";

import { ScreenEditor, TemplateCard } from "@/components";
import { useState, useEffect } from "react";
import { X } from "react-feather";
import { useTheme } from "@emotion/react";

type BoardScreen = {
	id: string;
	name: string;
	elements: number | null;
	displays?: IScreen | null;
};

interface ExperimentDisplaysProps {
	screens: BoardScreen[];
	onBack?: () => void;
	onDeleteScreen?: (screenId: string) => void;
	onUpdateScreen?: (screenId: string, displays: IScreen) => void;
}

const ExperimentDisplays: React.FC<ExperimentDisplaysProps> = ({
	screens,

	onBack,
	onDeleteScreen,
	onUpdateScreen,
}) => {
	const theme = useTheme();
	const [mode, setMode] = useState<"view" | "create">("view");
	const [selectedScreen, setSelectedScreen] = useState<BoardScreen | null>(null);

	useEffect(() => {
		if (screens.length === 0) {
			setMode("view");
			setSelectedScreen(null);
		}
	}, [screens]);

	if (mode === "create") {
		return (
			<ScreenEditor
				boardScreen={selectedScreen}
				onSave={(updatedDisplays) => {
					if (selectedScreen && updatedDisplays) {
						onUpdateScreen?.(selectedScreen.id, updatedDisplays);
					}
					setMode("view");
					onBack?.();
				}}
			/>
		)
	}

	return (
		<>
			<S.Board>
				{screens.map((s) => (
					<S.ScreenCard key={s.id}>
						{onDeleteScreen && (
							<S.DeleteButton
								className="delete-btn"
								onClick={(e) => {
									e.stopPropagation();
									onDeleteScreen(s.id);
								}}
							>
								<X size={14} color={theme.main.danger} />
							</S.DeleteButton>
						)}
						{s.displays && <TemplateCard screen={s.displays} onClick={() => {
							// Skip editor for calibration screens
							if (s.displays?.is_calibration) {
								return;
							}
							setSelectedScreen(s);
							setMode("create");
						}} />}
						<Typography variant="body-1" textColor="textOne">
							{s.name}
						</Typography>
					</S.ScreenCard>
				))}
			</S.Board>
		</>
	)
}

export default ExperimentDisplays;
