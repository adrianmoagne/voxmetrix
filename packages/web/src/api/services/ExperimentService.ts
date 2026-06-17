import type { AxiosResponse } from "axios";
import { api } from "../api";
import { Endpoints } from "../endpoints";

interface Participant {
	email: string;
	status: "invited" | "started" | "completed";
	invitedAt: string;
	startedAt?: string;
	completedAt?: string;
}

interface ShareLinkResult {
	success: boolean;
	data: {
		experimentId: string;
		shareUrl: string;
	};
}

const fetchAllExperiments = async (): Promise<AxiosResponse> => {
	const res = await api.get(Endpoints.Experiments);
	return res;
};

const createExperiment = async (payload: Record<string, unknown>): Promise<AxiosResponse> => {
	const res = await api.post(Endpoints.Experiments, payload);
	return res;
};

const updateExperiment = async (
	experimentId: string,
	payload: Record<string, unknown>
): Promise<AxiosResponse> => {
	const res = await api.patch(
		Endpoints.ExperimentById.replace(":id", experimentId),
		payload
	);
	return res;
};

const fetchExperimentById = async (experimentId: string): Promise<AxiosResponse> => {
	const res = await api.get(Endpoints.ExperimentById.replace(":id", experimentId));
	return res;
};

const deleteExperimentById = async (experimentId: string): Promise<AxiosResponse> => {
	const res = await api.delete(Endpoints.ExperimentById.replace(":id", experimentId));
	return res;
};

const getShareLink = async (
	experimentId: string
): Promise<AxiosResponse<ShareLinkResult>> => {
	const res = await api.get<ShareLinkResult>(
		Endpoints.ExperimentShare.replace(":id", experimentId)
	);
	return res;
};

const fetchParticipants = async (
	experimentId: string
): Promise<AxiosResponse<{ success: boolean; data: Participant[] }>> => {
	const res = await api.get(Endpoints.ExperimentParticipants.replace(":id", experimentId));
	return res;
};

// Public endpoint for participants (no auth required)
const fetchExperimentForParticipant = async <TResponse = unknown>(
	experimentId: string,
	options?: { email?: string; condition?: string }
): Promise<AxiosResponse<TResponse>> => {
	const url = Endpoints.ExperimentPublicRun.replace(":id", experimentId);
	const params: Record<string, string> = {};
	if (options?.email) {
		params.email = options.email;
	}
	if (options?.condition) {
		params.condition = options.condition;
	}
	const res = await api.get<TResponse>(url, {
		params: Object.keys(params).length > 0 ? params : undefined,
	});
	return res;
};

// Public endpoint for participants to submit results
const submitResult = async (
	experimentId: string,
	resultData: Record<string, unknown>
): Promise<AxiosResponse<{ success: boolean; data: { resultId: string } }>> => {
	const url = Endpoints.ExperimentSubmitResult.replace(":id", experimentId);
	const res = await api.post(url, resultData);
	return res;
};

// Authenticated endpoint for researchers to get results
const fetchResults = async (
	experimentId: string
): Promise<AxiosResponse<{ success: boolean; data: ExperimentResult[]; count: number }>> => {
	const url = Endpoints.ExperimentGetResults.replace(":id", experimentId);
	const res = await api.get(url);
	return res;
};

export interface ExperimentResult {
	_id: string;
	experiment: string;
	participantEmail?: string;
	participantName?: string;
	participantCondition?: string;
	completedAt: string;
	browserInfo?: {
		userAgent?: string;
		windowWidth?: number;
		windowHeight?: number;
	};
	schemaVersion?: number;
	steps?: ExperimentStep[];
	calibrationData?: unknown;
	trials?: ExperimentTrial[];
}

export interface ExperimentStep {
	screenUid: string;
	rowUid?: string;
	advanceReason?: string;
	startedAt?: number;
	completedAt?: number;
	responses?: Record<string, unknown>;
	audioTelemetry?: Record<string, unknown>;
	extras?: Record<string, unknown>;
}


export interface QuadrantMetric {
	fixation_time_ms: number;
	fixation_percentage: number;
}

export interface QuadrantMetrics {
	a: QuadrantMetric;
	b: QuadrantMetric;
	c: QuadrantMetric;
	d: QuadrantMetric;
}

export interface ExperimentTrial {
	trial_index: number;
	screen_id: string;
	audio_id?: string;
	audio_filename?: string;
	type: string;
	stimulus?: string;
	rt?: number;
	response?: unknown;
	targets?: {
		selector: string;
		image_id?: string;
		image_filename?: string;
		bounding_box: { left: number; right: number; top: number; bottom: number };
		fixation_percentage: number;
		fixation_time_ms: number;
		total_trial_time_ms: number;
	}[];
	gaze_data?: { x: number; y: number; t: number }[];
	viewport?: { width: number; height: number };
	quadrant_metrics?: QuadrantMetrics;
}

export const ExperimentService = {
	fetchAllExperiments,
	createExperiment,
	updateExperiment,
	fetchExperimentById,
	deleteExperimentById,
	getShareLink,
	fetchParticipants,
	fetchExperimentForParticipant,
	submitResult,
	fetchResults,
};
