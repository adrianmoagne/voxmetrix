export const WEBGAZER_VIDEO_CONTAINER_ID = "webgazerVideoContainer";

const PREVIEW_ROOT_SELECTOR = "[data-webgazer-preview-root]";

export interface WebGazerPreviewLayout {
	width: number;
	height: number;
}

const getWebGazer = (): WebGazer | null => {
	if (typeof window === "undefined") return null;
	return window.webgazer ?? null;
};

export function getVideoContainer(): HTMLElement | null {
	return document.getElementById(WEBGAZER_VIDEO_CONTAINER_ID);
}

export function applyWebGazerPreviewLayout(layout: WebGazerPreviewLayout): void {
	const { width, height } = layout;
	const webgazer = getWebGazer();
	const container = getVideoContainer();

	if (webgazer?.setVideoViewerSize) {
		webgazer.setVideoViewerSize(width, height);
	}

	if (container) {
		container.style.position = "relative";
		container.style.top = "auto";
		container.style.left = "auto";
		container.style.margin = "0";
		container.style.width = `${width}px`;
		container.style.height = `${height}px`;
	}
}

function getOrCreatePreviewRoot(container: HTMLElement): HTMLDivElement {
	const existing = container.querySelector<HTMLDivElement>(PREVIEW_ROOT_SELECTOR);
	if (existing) return existing;

	const root = document.createElement("div");
	root.dataset.webgazerPreviewRoot = "true";
	root.style.position = "relative";
	root.style.margin = "0 auto";
	container.appendChild(root);
	return root;
}

/** Mount WebGazer's video container (video + overlay + feedback box stay nested). */
export function mountWebGazerPreview(
	container: HTMLElement,
	layout: WebGazerPreviewLayout
): void {
	const videoContainer = getVideoContainer();
	if (!videoContainer) return;

	const root = getOrCreatePreviewRoot(container);
	root.style.width = `${layout.width}px`;
	root.style.height = `${layout.height}px`;

	videoContainer.style.display = "block";
	root.appendChild(videoContainer);

	applyWebGazerPreviewLayout(layout);
}

export function releaseWebGazerPreview(): void {
	const videoContainer = getVideoContainer();
	if (videoContainer) {
		videoContainer.style.display = "none";

		if (videoContainer.parentElement && videoContainer.parentElement !== document.body) {
			document.body.appendChild(videoContainer);
		}

		videoContainer.style.position = "fixed";
		videoContainer.style.top = "0px";
		videoContainer.style.left = "0px";
	}

	document.querySelectorAll(PREVIEW_ROOT_SELECTOR).forEach((root) => root.remove());
}

/** WebGazer sets solid cornflowerblue when both eyes are inside the validation box. */
export function isFaceInValidationBox(): boolean {
	const feedback = document.getElementById("webgazerFaceFeedbackBox");
	if (!feedback) return false;

	const style = getComputedStyle(feedback);
	if (style.borderStyle !== "solid") return false;

	const color = style.borderTopColor.toLowerCase();
	return color === "cornflowerblue" || color === "rgb(100, 149, 237)";
}
