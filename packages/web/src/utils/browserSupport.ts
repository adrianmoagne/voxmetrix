interface UserAgentData {
	brands: { brand: string }[];
	mobile: boolean;
}

/**
 * Eye tracking ties each gaze sample to its camera frame through `VideoFrame` timestamps.
 * Only Chromium browsers (Chrome, Edge, Brave, Opera) report them correctly; in Firefox
 * almost every frame is discarded as a repeat. Firefox and Safari have no
 * `navigator.userAgentData`, and phones report `mobile`.
 */
export const isSupportedEyeTrackingBrowser = (): boolean => {
	const uaData = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
	if (!uaData) return false;
	return !uaData.mobile && uaData.brands.some(({ brand }) => brand === "Chromium");
};