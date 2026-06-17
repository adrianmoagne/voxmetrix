export enum SystemErrors {
	USER_NOT_FOUND = "User not found",
	INVALID_PASSWORD = "Invalid password",
	UNAUTHORIZED = "Unauthorized access",
	EMAIL_ALREADY_EXISTS = "Email already exists",
	USERNAME_ALREADY_EXISTS = "Username already exists",

	// Media
	NO_FILE_UPLOADED = "No file uploaded",
	UNSUPPORTED_FILE_TYPE = "Unsupported file type",

	// Screen
	TEMPLATE_NOT_FOUND = "Template not found",
	TEMPLATE_HAS_NO_TEMPLATE_ITEMS = "Template has no template items",
	NO_ASSETS_PROVIDED = "No assets provided",
	NO_SCREENS_PROVIDED = "No screens provided. Please provide a screens array.",
	MISSING_KEY_IN_SCREEN = "Screen is missing required key",
	MISSING_ASSETS_FOR_TYPE_IMAGE = "Missing assets for type IMAGE",
	MISSING_ASSETS_FOR_TYPE_AUDIO = "Missing assets for type AUDIO",

	// Experiment
	INVALID_EXPERIMENT_DATA = "Invalid experiment data",
	INVALID_EXPERIMENT_DEFINITION = "Invalid experiment definition",
	MISSING_REQUIRED_FIELDS = "Missing required fields",
	EXPERIMENT_NOT_FOUND = "Experiment not found",
	NO_GROUPS = "No participant conditions are configured for this experiment",
	MISSING_URL_CONDITION = "This experiment requires a condition in the URL (?condition=)",
	INVALID_URL_CONDITION = "The requested participant condition is not available for this experiment",

	// Project
	PROJECT_NOT_FOUND = "Project not found",
}

export type TSystemErrors = keyof typeof SystemErrors;
