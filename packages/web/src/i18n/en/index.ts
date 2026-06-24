import type { Translation } from "../i18n-types.js";

const en = {
	App: "VoxMetrix",
	Roles: {
		Admin: "Admin",
		Participant: "Participant",
	},
	Login: {
		Title: "Hello, insert your credentials to login.",
		Placeholders: {
			Email: "Email",
			Password: "Password",
		},
	},
	SignUp: {
		AccountTitle: "Let's create your credentials.",
		PersonalTitle: "Welcome, tell us who you are.",
		Placeholders: {
			Name: "Name",
			Username: "Username",
			Institution: "Institution",
			Phone: "Phone",
			Email: "Email",
			Password: "Password",
			Description: "About you ... purposes ...",
			ConfirmPassword: "Confirm Password",
		},
	},
	Forms: {
		Title: "Forms",
		Subtitle: "Manage forms and results.",
		Filters: {
			All: "All",
			InUse: "In Use",
			Status: "Status",
			Disabled: "Disabled",
			Enabled: "Enabled",
		},
		Headers: {
			ID: "ID",
			Alias: "Alias",
			Items: "Items",
			UsedIn: "Used in",
			Results: "Results",
			Status: "Status",
			CreatedAt: "Created at",
			Actions: "Actions",
		},
		Buttons: {
			Build: "Build",
		},
	},
	Medias: {
		Title: "Medias",
		Subtitle: "See all your images and audio files.",
		Filters: {
			All: "All",
			Audio: "Audio",
			Image: "Image",
			InUse: "In Use",
			Name: "Name",
			Size: "Size",
		},
	},
	Build: {
		Title: "Build",
		Subtitle: "Panel to create screens and forms.",
		Filters: {
			All: "All",
			Mine: "Mine",
		},
		Headers: {
			ID: "ID",
			Alias: "Alias",
			Experiments: "Experiments",
			UsedIn: "Used in",
			Status: "Status",
			CreatedAt: "Created at",
			Participants: "Participants",
			Actions: "Actions",
		},
	},
	Modals: {
		MediaViewer: {
			Title: "Media Viewer",
			Details: {
				Subtitle: "Details",
				Type: "Type",
				Filename: "Filename",
				Size: "Size",
				UploadAt: "Uploaded at",
				URL: "URL",
				UsedIn: "Used in",
				Extension: "Extension",
			},
			Of: "of {total} medias",
		},
		AppSettings: {
			Language: "Language",
			ChangeLanguage: "Change application language",
			Theme: "Theme",
			ChangeTheme: "Change application appearance",
			Light: "Light",
			Dark: "Dark",
		},
		Upload: {
			Title: "Upload Files",
			DragAndDrop: "Drag and drop files here, or click to select files",
			SelectFiles: "Select Files",
			SelectedFiles: "Selected Files ({count})",
			ClearAll: "Clear All",
			SupportedFormats: "Supported formats: Audio (MP3, WAV, etc.) and Images (JPG, PNG, etc.)",
		},
	},
	Buttons: {
		Next: "Next",
		Back: "Back",
		Submit: "Submit",
		Enter: "Enter",
		Upload: "Upload",
		Download: "Download",
		Delete: "Delete",
		New: "New",
	},
	Sidebar: {
		Search: "Search",
		Nav: {
			Projects: "Projects",
			Medias: "Medias",
			Forms: "Forms",
			Build: "Build",
		},
	},
	Breadcrumbs: {
		admin: "Admin",
		projects: "Projects",
		medias: "Medias",
		forms: "Forms",
		builder: "Build",
		create: "Create",
		edit: "Edit",
	},
	SystemErrors: {
		InvalidEmail: "Invalid email address.",
		InvalidPassword:
			"Password does not meet the requirements. Min {minLength} characters, at least.",
		InvalidConfirmPassword: "Passwords do not match.",
		RequiredField: "The field {name} is required.",
		EmailAlreadyExists: "This email is already registered.",
		UsernameAlreadyExists: "This username is already taken.",
	},
	Links: {
		SignUp: "Sign Up",
		Login: "Login",
	},
	UserControl: {
		Logout: "Logout",
		Settings: "Settings",
	},
	Languages: {
		English: "English",
		Portuguese: "Português",
	},
} satisfies Translation;

export default en;