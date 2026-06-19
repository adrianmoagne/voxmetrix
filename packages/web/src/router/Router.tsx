import { Entrypoint } from "@/components";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { Pages } from "../@types";
import ProtectedRoute from "./ProtectedRoute";



const LoginModule = lazy(() => import("../pages/Login/Login"));
const SignUpModule = lazy(() => import("../pages/SignUp/SignUp"));
const ProjectsModule = lazy(() => import("../pages/Projects/Projects"));
const ProjectDetailModule = lazy(() => import("../pages/Projects/ProjectDetail"));
const ProjectExperimentCreateModule = lazy(() => import("../pages/Projects/ExperimentCreate"));
const ExperimentModule = lazy(() => import("../pages/Experiment/Experiment"));
const MediasModule = lazy(() => import("../pages/Medias/Medias"));
const FormsModule = lazy(() => import("../pages/Forms/Forms"));
const FormBuilderModule = lazy(() => import("../pages/FormBuilder/FormBuilder"));
const BuilderModule = lazy(() => import("../pages/Builder/Builder"));
const ScreenBuilderModule = lazy(() => import("../pages/ScreenBuilder/ScreenBuilder"));

// Unified pages (type-agnostic)
const ExperimentPreviewModule = lazy(() => import("../pages/ExperimentPreview/ExperimentPreview"));
const ExperimentParticipantRuntimeModule = lazy(() => import("../pages/ExperimentParticipantRuntime/ExperimentParticipantRuntimePage"));
const ExperimentEnginePreviewModule = lazy(() => import("../pages/ExperimentEnginePreview/ExperimentEnginePreview"));
const ScreenEntityEditorPreviewModule = lazy(
	() => import("../pages/ScreenEntityEditorPreview/ScreenEntityEditorPreview")
);
const ExperimentEditorPreviewModule = lazy(
	() => import("../pages/ExperimentEditorPreview/ExperimentEditorPreview")
);

const router = createBrowserRouter([
	{
		path: Pages.Base,
		element: <Navigate to={Pages.Projects} replace />,
	},
	{
		path: Pages.Login,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<LoginModule />
			</Suspense>
		),
	},
	{
		path: Pages.SignUp,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<SignUpModule />
			</Suspense>
		),
	},
	{
		path: Pages.Projects,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<ProjectsModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},
	{
		path: Pages.ProjectDetail,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<ProjectDetailModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},
	{
		path: Pages.ProjectExperimentCreate,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<ProjectExperimentCreateModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},
	{
		path: Pages.Experiment,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<ExperimentModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},
	// Unified preview route (authenticated)
	{
		path: Pages.ExperimentPreview,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<ExperimentPreviewModule />
				</ProtectedRoute>
			</Suspense>
		),
	},
	// Entity engine preview (dev/test, no auth required)
	{
		path: Pages.ExperimentEnginePreview,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ExperimentEnginePreviewModule />
			</Suspense>
		),
	},
	{
		path: Pages.ScreenEntityEditorPreview,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ScreenEntityEditorPreviewModule />
			</Suspense>
		),
	},
	{
		path: Pages.ExperimentEditorPreview,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ExperimentEditorPreviewModule />
			</Suspense>
		),
	},

	{
		path: Pages.Medias,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<MediasModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},
	{
		path: Pages.Forms,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<FormsModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},
	{
		path: Pages.FormBuilder,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<FormBuilderModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},
	{
		path: Pages.FormBuilderEdit,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<FormBuilderModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},
	{
		path: Pages.Builder,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<BuilderModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},
	{
		path: Pages.ScreenBuilder,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ProtectedRoute>
					<Entrypoint>
						<ScreenBuilderModule />
					</Entrypoint>
				</ProtectedRoute>
			</Suspense>
		),
	},

	// Unified participant route (public, no auth)
	{
		path: Pages.ExperimentParticipant,
		element: (
			<Suspense fallback={<div>Loading...</div>}>
				<ExperimentParticipantRuntimeModule />
			</Suspense>
		),
	},
	// Legacy participant redirects
	
]);

export default router;
