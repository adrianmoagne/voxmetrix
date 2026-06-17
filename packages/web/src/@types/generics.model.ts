import type { SelectOption } from "@leux/ui";

export const LocalStorageKeys = {
	SidebarCollapsed: "tts-sidebar-collapsed",
	I18NLocale: "i18n-locale",
};

export const Pages = {
	Base: "/",
	Login: "/login",
	SignUp: "/signup",
	Admin: "/admin",
	Projects: "/admin/projects",
	ProjectDetail: "/admin/projects/:id",
	ProjectExperimentCreate: "/admin/projects/:id/experiments/new",
	Experiment: "/admin/experiments/:id",
	Medias: "/admin/medias",
	Forms: "/admin/forms",
	FormBuilder: "/admin/forms/builder",
	FormBuilderEdit: "/admin/forms/builder/:id",
	Builder: "/admin/builder",
	ScreenBuilder: "/admin/builder/:id",
	// Unified routes (type-agnostic)
	ExperimentPreview: "/admin/experiment-preview/:id",
	ExperimentParticipant: "/experiment/run/:id",
	// Entity engine preview
	ExperimentEnginePreview: "/admin/experiment-engine-preview",
	ScreenEntityEditorPreview: "/admin/screen-entity-editor-preview",
	ExperimentEditorPreview: "/admin/experiment-editor-preview",
	// Legacy preview routes (redirect to unified)
	ExperimentPreviewEyeTracking: "/admin/experiment-preview-eyetracking/:id",
	ExperimentPreviewMos: "/admin/experiment-preview-mos/:id",
	ExperimentPreviewTextHighlighting: "/admin/experiment-preview-texthighlighting/:id",
	// Legacy participant routes (redirect to unified)
	ExperimentParticipantEyeTracking: "/experiment/eyetracking/:id",
	ExperimentParticipantMos: "/experiment/mos/:id",
	ExperimentParticipantTextHighlighting: "/experiment/texthighlighting/:id",
};

export const ModalId = {
	MediaViewer: "media-viewer",
	AppSettings: "app-settings",
	Upload: "upload",
	AddItem: "add-item",
	MediaGallery: "media-gallery",
	GridSettings: "grid-settings",
	SetupNewScreen: "setup-new-screen",
	TemplateGallery: "template-gallery",
	NewProject: "new-project",
	InviteParticipants: "invite-participants",
	NewExperiment: "new-experiment",
};

export const ModalSizes: Record<keyof typeof ModalId, number> = {
	MediaViewer: 720,
	AppSettings: 480,
	Upload: 520,
	AddItem: 300,
	MediaGallery: 600,
	GridSettings: 420,
	SetupNewScreen: 700,
	TemplateGallery: 1000,
	NewProject: 400,
	InviteParticipants: 500,
	NewExperiment: 620,
};

export const LocalesArr: SelectOption[] = [
	{
		label: "English (US)",
		value: "en",
	},
	{
		label: "Português (Brasil)",
		value: "pt-BR",
	},
];
