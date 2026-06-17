import { Button } from "@leux/ui";
import S from "./SetupNewScreenModal.styles";

const SetupNewScreenModalFooter = () => {
	return (
		<S.FooterRow>
			<Button>Cancel</Button>
			<Button colorScheme="primary">Next</Button>
		</S.FooterRow>
	);
};

export { SetupNewScreenModalFooter };
