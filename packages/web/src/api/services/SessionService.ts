import type { AxiosResponse } from "axios";
import { api } from "../api";
import { Endpoints } from "../endpoints";

/** Participant sessions: a result saved step by step, written with the token from `startSession`. */

const TOKEN_HEADER = "X-Session-Token";

export interface SessionRef {
	experimentId: string;
	resultId: string;
	token: string;
}

export interface SessionPlanEntry {
	planIndex: number;
	stepUid: string;
	rowUid?: string;
}

export interface BrowserInfo {
	userAgent: string;
	windowWidth: number;
	windowHeight: number;
	timeOrigin: number;
}

export interface StartSessionPayload {
	participant: { name: string; email: string };
	participantCondition?: string;
	browser_info: BrowserInfo;
	seed: number;
	plan: SessionPlanEntry[];
}

export interface SessionState {
	status: "in_progress" | "completed";
	seed: number;
	plan: SessionPlanEntry[];
	participantCondition?: string;
	participant: { name?: string; email?: string };
	/** Steps saved without a gap from the start. */
	savedStepCount: number;
	/** Highest plan index among those steps; null when none has one. */
	lastPlanIndex: number | null;
}

export const currentBrowserInfo = (): BrowserInfo => ({
	userAgent: navigator.userAgent,
	windowWidth: window.innerWidth,
	windowHeight: window.innerHeight,
	timeOrigin: performance.timeOrigin,
});

const sessionUrl = (template: string, session: SessionRef) =>
	template.replace(":id", session.experimentId).replace(":resultId", session.resultId);

const tokenHeaders = (session: SessionRef) => ({ headers: { [TOKEN_HEADER]: session.token } });

const startSession = async (
	experimentId: string,
	payload: StartSessionPayload
): Promise<AxiosResponse<{ data: { resultId: string; token: string } }>> => {
	const url = Endpoints.ExperimentSessionStart.replace(":id", experimentId);
	const res = await api.post(url, payload);
	return res;
};

const getSession = async (session: SessionRef): Promise<AxiosResponse<{ data: SessionState }>> => {
	const res = await api.get(
		sessionUrl(Endpoints.ExperimentSession, session),
		tokenHeaders(session)
	);
	return res;
};

const saveStep = async (
	session: SessionRef,
	seq: number,
	step: unknown
): Promise<AxiosResponse> =>
	api.put(
		sessionUrl(Endpoints.ExperimentSessionStep, session).replace(":seq", String(seq)),
		{ step },
		tokenHeaders(session)
	);

const recordResume = async (
	session: SessionRef,
	payload: { fromSeq: number; fromPlanIndex: number; browser_info: BrowserInfo }
): Promise<AxiosResponse> =>
	api.post(sessionUrl(Endpoints.ExperimentSessionResume, session), payload, tokenHeaders(session));

const completeSession = async (session: SessionRef, stepCount: number): Promise<AxiosResponse> =>
	api.post(
		sessionUrl(Endpoints.ExperimentSessionComplete, session),
		{ stepCount },
		tokenHeaders(session)
	);

export const SessionService = {
	startSession,
	getSession,
	saveStep,
	recordResume,
	completeSession,
};