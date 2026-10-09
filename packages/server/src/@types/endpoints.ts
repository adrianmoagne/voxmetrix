export enum Endpoints {
	// Auth
	Me = "/auth/me",
	Login = "/auth/login",
	Register = "/auth/register",
	Logout = "/auth/logout",

	// Admin User
	AdminCreate = "/admin",
	AdminbyId = "/admin",

	// Media
	MediaCreate = "/media",
	MediaList = "/media",
	MediaListById = "/media/:id",
	MediaUpdate = "/media/:id",
	MediaDelete = "/media/:id",

	//Form
	FormsCreate = "/forms",
	FormsList = "/forms",
	FormsListById = "/forms/:id",
	FormsUpdate = "/forms/:id",
	FormsDelete = "/forms/:id",

	//Screen
	ScreenCreate = "/screen",
	ScreenList = "/screen",
	ScreenListById = "/screen/:id",
	ScreenUpdate = "/screen/:id",
	ScreenDelete = "/screen/:id",
	ScreenFromTemplate = "/screen/from-template",

	//Experiment
	ExperimentCreate = "/experiments",
	ExperimentList = "/experiments",
	ExperimentGetById = "/experiments/:id",
	ExperimentUpdate = "/experiments/:id",
	ExperimentDelete = "/experiments/:id",
	ExperimentShareLink = "/experiments/:id/share",
	ExperimentGetParticipants = "/experiments/:id/participants",
	// Public endpoint for participants
	ExperimentPublicRun = "/experiments/:id/run",
	// Results endpoints
	ExperimentSubmitResult = "/experiments/:id/results",
	ExperimentGetResults = "/experiments/:id/results",
	ExperimentExportResults = "/experiments/:id/results/export",
	// Participant sessions: results saved step by step
	ExperimentSessionStart = "/experiments/:id/sessions",
	ExperimentSessionGet = "/experiments/:id/sessions/:resultId",
	ExperimentSessionStep = "/experiments/:id/sessions/:resultId/steps/:seq",
	ExperimentSessionResume = "/experiments/:id/sessions/:resultId/resumes",
	ExperimentSessionComplete = "/experiments/:id/sessions/:resultId/complete",

	//Project
	ProjectCreate = "/projects",
	ProjectList = "/projects",
	ProjectListById = "/projects/:id",
	ProjectUpdate = "/projects/:id",
	ProjectDelete = "/projects/:id",
}
