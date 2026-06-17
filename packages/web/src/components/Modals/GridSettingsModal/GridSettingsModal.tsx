import { Typography, Grid, Box } from "@leux/ui";
import S from "./GridSettingsModal.styles";
import type { StoreState } from "src/store/store";
import { useDispatch, useSelector } from "react-redux";
import { createScreenActions } from "@/store";
import type { GridType } from "@/@types";
import { useTheme } from "@emotion/react";

function Content() {
	const dispatch = useDispatch();
	const { gridType } = useSelector((state: StoreState) => state.createScreen);
	const handleGridSizeSelect = (size: GridType) => {
		dispatch(createScreenActions.setGridType(size));
	};
	const theme = useTheme(); // <-- add

	const getGridSize = (size: string) => {
		switch (size) {
			case "1x1":
				return 1;
			case "2x2":
				return 2;
			case "3x3":
				return 3;
			default:
				return 3;
		}
	};

	return (
		<S.Container>
			<Typography>Select a grid layout</Typography>
			<S.Row>
				<S.SelectableButton
					$selected={gridType === "1x1"}
					onClick={() => handleGridSizeSelect("1x1")}
				>
					1x1
				</S.SelectableButton>
				<S.SelectableButton
					$selected={gridType === "2x2"}
					onClick={() => handleGridSizeSelect("2x2")}
				>
					2x2
				</S.SelectableButton>
				<S.SelectableButton
					$selected={gridType === "3x3"}
					onClick={() => handleGridSizeSelect("3x3")}
				>
					3x3
				</S.SelectableButton>
			</S.Row>
			<Typography>Grid Preview</Typography>
			<Grid
				cols={getGridSize(gridType)}
				rows={getGridSize(gridType)}
				gap={{ col: 5, row: 5 }}
				width="100%"
				padding="12px"
			>
				{Array.from({ length: getGridSize(gridType) ** 2 }).map((_, index) => (
					<Box
						key={index}
						padding={4}
						customStyles={{
							backgroundColor: theme.main.backgroundTwo,
						}}
						textColor="darker"
						centered
						borderRadius="12px"
						height={56}
					>
						<Typography variant="body-1">{index + 1}</Typography>
					</Box>
				))}
			</Grid>
		</S.Container>
	);
}

const GridSettingsModal = {
	Content,
};

export default GridSettingsModal;
