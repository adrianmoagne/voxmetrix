export const Endpoints = {
	// Auth
	Me: "/api/auth/me",
	CurrentUser: "/api/admin",
	Login: "/api/auth/login",
	Logout: "/api/auth/logout",
	Register: "/api/auth/register",

	// Media
	Media: "/api/media",

	// Projects
	Projects: "/api/projects",
	ProjectById: "/api/projects/:id",

	// Forms
	Forms: "/api/forms",
	FormById: "/api/forms/:id",

	// Experiments
	Experiments: "/api/experiments",
	ExperimentById: "/api/experiments/:id",
	ExperimentShare: "/api/experiments/:id/share",
	ExperimentParticipants: "/api/experiments/:id/participants",
	// Public endpoint for participants
	ExperimentPublicRun: "/api/experiments/:id/run",
	ExperimentSubmitResult: "/api/experiments/:id/results",
	ExperimentGetResults: "/api/experiments/:id/results",
} as const;

export type Endpoint = (typeof Endpoints)[keyof typeof Endpoints];
