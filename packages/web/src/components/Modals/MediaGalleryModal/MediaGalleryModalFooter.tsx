import S from "./MediaGalleryModal.styles";
import { Box, Button } from "@leux/ui";
const MediaGalleryModalFooter: React.FC = () => {
	return (
		<S.FooterRow>
			<Box flex flexDirection="row" alignItems="end" flexGap={12}>
				<Button>Cancel</Button>

				<Button colorScheme="primary">Add</Button>
			</Box>
		</S.FooterRow>
	);
};

export { MediaGalleryModalFooter };
