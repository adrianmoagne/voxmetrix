import { useEffect, useState, useCallback, useRef } from "react";
import { ExperimentService } from "@/api/services";
import { defaultCalibrationConfig, type CalibrationConfig, type IScreen, type ScreenComponentType } from "@/@types";
import { useExperimentRunner, type Trial, type TrialResult } from "./useExperimentRunner";
import { useWebGazer } from "./useWebGazer";

export interface Participant {
	name: string;
	email: string;
}

export interface UseExperimentOptions {
	experimentId: string;
	/** @deprecated Use screen components instead. Kept for backward compatibility. */
	experimentType?: "mos" | "eyetrackingMos" | "textHighlighting";
	participant?: Participant;
	isPreview?: boolean;
	skipParticipantForm?: boolean;
	calibrationConfig?: CalibrationConfig;
	onFinish?: (results: any) => void;
}

export interface UseExperimentReturn {
	currentTrial: Trial | null;
	currentTrialIndex: number;
	totalTrials: number;
	trialStartTime: number;
	completeTrial: (response: any, extras?: Partial<TrialResult>) => void;
	isLoading: boolean;
	isSubmitting: boolean;
	isFinished: boolean;
	error: string | null;
	startExperiment: () => void;
	webgazer: ReturnType<typeof useWebGazer>;
	// Experiment metadata
	totalAudioTrials: number;
	audioTrialCounter: number;
	calibrationConfig: CalibrationConfig;
	// Validation state for recalibration
	validationResults: TrialResult[];
	needsRecalibration: boolean;
	triggerRecalibration: () => void;
}

// Feedback survey questions (same as the existing ones)
const feedbackQuestions = [
	{
		prompt: "A execucao desta avaliacao foi uma experiência agradável",
		name: "user_experience",
		labels: ["1", "2", "3", "4", "5"],
	},
	{
		prompt: "As instrucoes deste método foram claras e fáceis de entender",
		name: "instruction_clarity",
		labels: ["1", "2", "3", "4", "5"],
	},
	{
		prompt: "Foi fácil realizar este método de avaliação sem cometer erros",
		name: "error_ease",
		labels: ["1", "2", "3", "4", "5"],
	},
	{
		prompt: "O tempo necessário para completar esta avaliação foi adequado",
		name: "time_adequacy",
		labels: ["1", "2", "3", "4", "5"],
	},
	{
		prompt: "Esse método de avaliação gerou cansaco fisico ou mental para ser concluído",
		name: "physical_mental_fatigue",
		labels: ["1", "2", "3", "4", "5"],
	},
];

const shuffleArray = <T,>(array: T[]): T[] => {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
};

// Helper: check if a screen has a specific component
function hasComponent(screen: IScreen, type: ScreenComponentType): boolean {
	return screen.components?.some((c) => c.type === type) ?? false;
}

// Helper: get component config
function getComponentConfig(screen: IScreen, type: ScreenComponentType): Record<string, any> | undefined {
	return screen.components?.find((c) => c.type === type)?.config;
}

// Helper: extract audio item from screen (real media or template placeholder)
function getAudioItem(screen: IScreen) {
	// First try real media
	const realItem = screen.items.find(
		(i) => i.type === "media" && typeof i.media !== "string" && i.media?.type === "audio"
	);
	if (realItem && typeof realItem.media !== "string" && realItem.media?.src) return realItem;
	// Fall back to template placeholder
	const templateItem = screen.items.find(
		(i) => i.type === "template" && i.template_type === "audio"
	);
	return templateItem ?? null;
}

// Helper: check if an audio item has actual playable media
function hasRealAudio(item: ReturnType<typeof getAudioItem>): item is NonNullable<typeof item> & { media: { src: string; _id: string; filename: string; type: string } } {
	return !!item && item.type === "media" && typeof item.media !== "string" && !!item.media?.src;
}

// Helper: extract picture items from screen
function getPictureItems(screen: IScreen) {
	return screen.items.filter(
		(i) =>
			(i.type === "media" && typeof i.media !== "string" && i.media?.type === "picture") ||
			(i.type === "template" && i.template_type === "image")
	);
}

// Helper: build image filenames map
function buildImageFilenames(screen: IScreen): Record<string, string> {
	const filenames: Record<string, string> = {};
	getPictureItems(screen).forEach((item) => {
		if (typeof item.media !== "string" && item.media) {
			filenames[item.media._id] = item.media.filename;
		}
	});
	return filenames;
}

// Check if any screen in the experiment needs eye tracking
export function screensNeedEyeTracking(screens: IScreen[]): boolean {
	return screens.some(
		(s) => hasComponent(s, "eye-tracking") || hasComponent(s, "calibration") || s.is_calibration
	);
}

// Generate calibration trial sequence
function buildCalibrationTrials(screenId: string): Trial[] {
	return [
		{
			id: `camera-init-${screenId}`,
			type: "camera-init",
			metadata: {},
		},
		{
			id: `cal-instructions-${screenId}`,
			type: "instruction",
			metadata: {
				content: `
					<p>Next, we need to calibrate the eye tracker.</p>
					<p>You will see a series of dots appear on the screen.</p>
					<p style="font-weight: bold;">Look at each dot as it appears.</p>
					<p>Try to keep your head still during calibration. Just move your eyes to look at the dots.</p>
				`,
				buttonText: "Start Calibration",
			},
		},
		{
			id: `calibration-${screenId}`,
			type: "calibration",
			metadata: {},
		},
		{
			id: `val-instructions-${screenId}`,
			type: "instruction",
			metadata: {
				content: `
					<p>Now we'll measure the accuracy of the calibration.</p>
					<p>Look at each dot as it appears on the screen.</p>
				`,
				buttonText: "Got it",
			},
		},
		{
			id: `validation-${screenId}`,
			type: "validation",
			metadata: { task: "validate" },
		},
		{
			id: `cal-done-${screenId}`,
			type: "instruction",
			metadata: {
				content: `
					<div style="max-width: 700px; margin: 0 auto; text-align: left;">
						<h2 style="text-align: center;">Calibration complete!</h2>
						<p>Now you will start the experiment. During the experiment:</p>
						<ul style="line-height: 1.8;">
							<li>You will hear audio speech samples.</li>
							<li>Images will be displayed on screen.</li>
							<li><strong>Look at the image</strong> that matches your perception of the audio.</li>
						</ul>
						<p><strong>Important:</strong> Keep your head still and only move your eyes during the trials.</p>
					</div>
				`,
				buttonText: "Start",
			},
		},
	];
}

export function buildTrials(
	screens: IScreen[],
	experimentType?: "mos" | "eyetrackingMos" | "textHighlighting"
): { trials: Trial[]; totalAudioTrials: number } {
	// Group consecutive screens into clusters based on tracking status
	type Cluster = { tracked: boolean; screens: IScreen[] };
	const clusters: Cluster[] = [];

	screens.forEach((screen) => {
		const isTracked = hasComponent(screen, "eye-tracking")
			|| hasComponent(screen, "audio-rating")
			|| hasComponent(screen, "text-highlighting")
			|| (experimentType === "eyetrackingMos" && !screen.components
				? screen.enable_tracking !== false
				: screen.enable_tracking === true);
		const lastCluster = clusters[clusters.length - 1];

		if (lastCluster && lastCluster.tracked === isTracked) {
			lastCluster.screens.push(screen);
		} else {
			clusters.push({ tracked: isTracked, screens: [screen] });
		}
	});

	// Shuffle only tracked clusters
	const shuffledScreens: IScreen[] = [];
	clusters.forEach((cluster) => {
		if (cluster.tracked) {
			shuffledScreens.push(...shuffleArray(cluster.screens));
		} else {
			shuffledScreens.push(...cluster.screens);
		}
	});

	// Count audio trials for progress
	const totalAudioTrials = shuffledScreens.filter((screen) => {
		const audioItem = getAudioItem(screen);
		const isActive = hasComponent(screen, "audio-rating")
			|| hasComponent(screen, "text-highlighting")
			|| hasComponent(screen, "eye-tracking")
			|| screen.enable_tracking;
		return isActive && audioItem;
	}).length;

	const trials: Trial[] = [];
	let audioTrialIndex = 0;

	// Check if calibration screens exist
	const hasCalibrationScreens = shuffledScreens.some(
		(s) => hasComponent(s, "calibration") || s.is_calibration
	);
	let calibrationInjected = false;

	shuffledScreens.forEach((screen) => {
		// --- Component-based inference (new path) ---
		if (screen.components && screen.components.length > 0) {
			// Calibration screen
			if (hasComponent(screen, "calibration")) {
				trials.push(...buildCalibrationTrials(screen._id));
				calibrationInjected = true;
				return;
			}

			const audioItem = getAudioItem(screen);
			const pictureItems = getPictureItems(screen);
			const hasAudio = !!audioItem;
			const realAudio = hasRealAudio(audioItem);
			const hasImages = pictureItems.length > 0;
			const imageFilenames = buildImageFilenames(screen);
			const formItem = screen.items.find((i) => i.type === "form" && i.form);

			// Resolve audio source (real media or silent placeholder for preview)
			const audioSource = realAudio
				? audioItem.media.src
				: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
			const audioId = realAudio ? audioItem.media._id : "preview";
			const audioFilename = realAudio ? audioItem.media.filename : "preview-audio";

			// Form trial
			if (formItem && formItem.form) {
				trials.push({
					id: `form-${screen._id}`,
					type: "form",
					screen,
					metadata: {
						screenId: screen._id,
						formId: formItem.form._id,
						formAlias: formItem.form.alias,
					},
				});
				return;
			}

			// Eye tracking: auto-inject calibration before first tracked screen
			if (hasComponent(screen, "eye-tracking") && !calibrationInjected && !hasCalibrationScreens) {
				trials.push(...buildCalibrationTrials("auto"));
				calibrationInjected = true;
			}

			// Eye tracking with fixation + gaze-tracked screen
			if (hasComponent(screen, "eye-tracking") && hasAudio && hasImages) {
				const fixationConfig = getComponentConfig(screen, "fixation-cross");
				if (hasComponent(screen, "fixation-cross")) {
					trials.push({
						id: `fixation-${screen._id}`,
						type: "fixation",
						duration: fixationConfig?.duration ?? 3000,
						metadata: { hideCursor: true },
					});
				}

				trials.push({
					id: `screen-${screen._id}`,
					type: "screen",
					screen,
					metadata: {
						screenId: screen._id,
						audioId,
						audioFilename,
						imageFilenames,
						trackingEnabled: true,
						trackGaze: true,
						containerStyle: { width: "80%", margin: "0 auto" },
					},
				});
				return;
			}

			// Audio rating (MOS)
			if (hasComponent(screen, "audio-rating") && hasAudio) {
				const ratingConfig = getComponentConfig(screen, "audio-rating");
				audioTrialIndex++;
				trials.push({
					id: `audio-rating-${screen._id}`,
					type: "audio-rating",
					audioSource,
					metadata: {
						screenId: screen._id,
						audioId,
						audioFilename,
						audioTrialIndex,
						totalAudioTrials,
						prompt: ratingConfig?.prompt ?? "Please rate the naturalness from 1 (Bad) to 5 (Excellent)",
						scale: ratingConfig?.scale ?? ["1 - Bad", "2 - Poor", "3 - Fair", "4 - Good", "5 - Excellent"],
					},
				});
				return;
			}

			// Text highlighting
			if (hasComponent(screen, "text-highlighting") && hasAudio) {
				const textItem = screen.items.find(
					(item) => (item.type === "text" || item.template_type === "text") && item.text
				);
				const fullText = textItem?.text || "Sample text for highlighting preview. Select the words that stand out to you.";
				audioTrialIndex++;
				trials.push({
					id: `text-highlighting-${screen._id}`,
					type: "text-highlighting",
					audioSource,
					metadata: {
						screenId: screen._id,
						audioId,
						audioFilename,
						fullText,
						audioTrialIndex,
						totalAudioTrials,
					},
				});
				return;
			}

			// Fallthrough: regular screen (has components, always show)
			trials.push({
				id: `screen-${screen._id}`,
				type: "screen",
				screen,
				metadata: {
					screenId: screen._id,
					imageFilenames,
					trackingEnabled: hasComponent(screen, "eye-tracking"),
					trackGaze: hasComponent(screen, "eye-tracking") && hasImages,
				},
			});
			return;
		}

		// --- Legacy path (no components, uses experimentType + enable_tracking) ---
		// Handle calibration screens
		if (screen.is_calibration && experimentType === "eyetrackingMos") {
			trials.push(...buildCalibrationTrials(screen._id));
			calibrationInjected = true;
			return;
		}

		const audioItem = getAudioItem(screen);
		const formItem = screen.items.find((item) => item.type === "form" && item.form);
		const pictureItems = getPictureItems(screen);
		const hasAudio = !!audioItem;
		const hasImages = pictureItems.length > 0;
		const trackingEnabled =
			experimentType === "eyetrackingMos"
				? screen.enable_tracking !== false
				: false;
		const imageFilenames = buildImageFilenames(screen);

		// Auto-inject calibration before first tracked screen if needed (eye tracking only)
		if (
			experimentType === "eyetrackingMos" &&
			trackingEnabled &&
			!calibrationInjected &&
			!hasCalibrationScreens
		) {
			trials.push(...buildCalibrationTrials("auto"));
			calibrationInjected = true;
		}

		// Form trial
		if (formItem && formItem.form) {
			trials.push({
				id: `form-${screen._id}`,
				type: "form",
				screen,
				metadata: {
					screenId: screen._id,
					formId: formItem.form._id,
					formAlias: formItem.form.alias,
				},
			});
			return;
		}

		// MOS experiment: audio with radio rating
		if (
			experimentType === "mos" &&
			screen.enable_tracking &&
			hasAudio &&
			audioItem &&
			typeof audioItem.media !== "string" &&
			audioItem.media
		) {
			audioTrialIndex++;
			trials.push({
				id: `audio-rating-${screen._id}`,
				type: "audio-rating",
				audioSource: audioItem.media.src,
				metadata: {
					screenId: screen._id,
					audioId: audioItem.media._id,
					audioFilename: audioItem.media.filename,
					audioTrialIndex,
					totalAudioTrials,
					prompt: "Please rate the naturalness from 1 (Bad) to 5 (Excellent)",
					scale: ["1 - Bad", "2 - Poor", "3 - Fair", "4 - Good", "5 - Excellent"],
				},
			});
			return;
		}

		// Eye tracking: audio + images = fixation + gaze-tracked screen
		if (experimentType === "eyetrackingMos" && hasAudio && hasImages) {
			trials.push({
				id: `fixation-${screen._id}`,
				type: "fixation",
				duration: 3000,
				metadata: { hideCursor: true },
			});

			trials.push({
				id: `screen-${screen._id}`,
				type: "screen",
				screen,
				metadata: {
					screenId: screen._id,
					audioId: typeof audioItem!.media !== "string" ? audioItem!.media?._id : undefined,
					audioFilename: typeof audioItem!.media !== "string" ? audioItem!.media?.filename : undefined,
					imageFilenames,
					trackingEnabled,
					trackGaze: trackingEnabled,
					containerStyle: hasImages ? { width: "80%", margin: "0 auto" } : undefined,
				},
			});
			return;
		}

		// Text highlighting: audio + text = text-highlighting trial
		if (
			experimentType === "textHighlighting" &&
			screen.enable_tracking &&
			hasAudio &&
			audioItem &&
			typeof audioItem.media !== "string" &&
			audioItem.media
		) {
			const textItem = screen.items.find(
				(item) => (item.type === "text" || item.template_type === "text") && item.text
			);
			if (textItem?.text) {
				audioTrialIndex++;
				trials.push({
					id: `text-highlighting-${screen._id}`,
					type: "text-highlighting",
					audioSource: audioItem.media.src,
					metadata: {
						screenId: screen._id,
						audioId: audioItem.media._id,
						audioFilename: audioItem.media.filename,
						fullText: textItem.text,
						audioTrialIndex,
						totalAudioTrials,
					},
				});
				return;
			}
		}

		// Regular screen (instruction, visual-only, etc.) - only if it has content
		if (screen.items.length > 0) {
			trials.push({
				id: `screen-${screen._id}`,
				type: "screen",
				screen,
				metadata: {
					screenId: screen._id,
					imageFilenames,
					trackingEnabled,
					trackGaze: experimentType === "eyetrackingMos" && trackingEnabled && hasImages,
				},
			});
		}
	});

	// Add feedback survey (only if there are actual trials)
	if (trials.length > 0) {
		trials.push({
			id: "feedback",
			type: "feedback",
			metadata: { questions: feedbackQuestions },
		});
	}

	return { trials, totalAudioTrials };
}

function buildResultJson(
	results: TrialResult[],
	experimentId: string,
	participant?: Participant,
	isPreview?: boolean
) {
	// Extract calibration data from validation trials
	const validationResults = results.filter((r) => r.metadata?.task === "validate");
	const initialValidation = validationResults[0];
	const finalValidation = validationResults[validationResults.length - 1];

	const calibrationData = {
		recalibration_performed: validationResults.length > 1,
		initial_validation: initialValidation
			? {
					percent_in_roi: initialValidation.response?.percent_in_roi,
					average_offset: initialValidation.response?.average_offset,
					validation_points: initialValidation.response?.raw_gaze,
			  }
			: null,
		final_validation: finalValidation
			? {
					percent_in_roi: finalValidation.response?.percent_in_roi,
					average_offset: finalValidation.response?.average_offset,
			  }
			: null,
	};

	// Process experiment trials (those with screenId)
	const experimentTrials = results.filter((r) => r.metadata?.screenId);

	const formattedTrials = experimentTrials.map((trial) => {
		const targets: any[] = [];

		// Send raw AOI data only. Fixation metrics are computed server-side.
		if (trial.targetBoundingBoxes) {
			for (const target of trial.targetBoundingBoxes) {
				targets.push({
					selector: `#item-${target.imageId}`,
					image_id: target.imageId,
					image_filename: target.filename,
					bounding_box: target.boundingBox,
				});
			}
		}

		return {
			trial_index: trial.trialIndex,
			screen_id: trial.metadata.screenId,
			audio_id: trial.metadata.audioId || null,
			audio_filename: trial.metadata.audioFilename || null,
			type: trial.type,
			rt: trial.rt,
			response: trial.response,
			targets,
			gaze_data: trial.gazeData || null,
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight,
			},
		};
	});

	return {
		experiment_id: experimentId,
		participant: participant
			? { name: participant.name, email: participant.email }
			: isPreview
			? { name: "Preview User", email: "preview@example.com" }
			: { name: null, email: null },
		timestamp: new Date().toISOString(),
		browser_info: {
			userAgent: navigator.userAgent,
			window_width: window.innerWidth,
			window_height: window.innerHeight,
		},
		calibration_data: calibrationData,
		trials: formattedTrials,
	};
}

export const useExperiment = ({
	experimentId,
	experimentType,
	participant,
	isPreview = false,
	calibrationConfig = defaultCalibrationConfig,
	onFinish,
}: UseExperimentOptions): UseExperimentReturn => {
	const [trials, setTrials] = useState<Trial[]>([]);
	const [totalAudioTrials, setTotalAudioTrials] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isFinishedState, setIsFinishedState] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [shouldStart, setShouldStart] = useState(false);

	// Validation/recalibration state
	const [validationResults, setValidationResults] = useState<TrialResult[]>([]);
	const [needsRecalibration, setNeedsRecalibration] = useState(false);

	const participantRef = useRef(participant);
	const onFinishRef = useRef(onFinish);
	const needsEyeTrackingRef = useRef(false);
	participantRef.current = participant;
	onFinishRef.current = onFinish;

	const webgazer = useWebGazer();

	const handleRunnerFinish = useCallback(
		async (results: TrialResult[]) => {
			const resultJson = buildResultJson(
				results,
				experimentId,
				participantRef.current,
				isPreview
			);

			// Cleanup eye tracking
			if (experimentType === "eyetrackingMos" || needsEyeTrackingRef.current) {
				webgazer.cleanup();
			}

			if (isPreview) {
				onFinishRef.current?.(resultJson);
				setIsFinishedState(true);
			} else {
				setIsSubmitting(true);
				try {
					await ExperimentService.submitResult(experimentId, resultJson);
					onFinishRef.current?.(resultJson);
					setIsFinishedState(true);
				} catch (err) {
					console.error("Failed to submit results:", err);
					setError(
						"Failed to submit results. Please keep this tab open and try again."
					);
				} finally {
					setIsSubmitting(false);
				}
			}
		},
		[experimentId, experimentType, isPreview, webgazer]
	);

	const runner = useExperimentRunner({
		trials,
		onFinish: handleRunnerFinish,
	});

	// Track audio trial counter
	const audioTrialCounter = runner.results.filter(
		(r) => r.type === "audio-rating" || r.type === "text-highlighting"
	).length;

	// Gorilla-style validation check
	const checkValidationFailed = useCallback(
		(validationResponse: any): boolean => {
			if (
				!validationResponse?.raw_gaze ||
				!Array.isArray(validationResponse.raw_gaze)
			) {
				return true;
			}

			const screenWidth = window.innerWidth;
			const screenHeight = window.innerHeight;
			const validationPointsPixels = calibrationConfig.validationPoints.map(
				([xPercent, yPercent]) => ({
					x: (xPercent / 100) * screenWidth,
					y: (yPercent / 100) * screenHeight,
				})
			);

			let failedPoints = 0;

			validationResponse.raw_gaze.forEach(
				(gazeDataForPoint: { x: number; y: number }[], targetIndex: number) => {
					if (!gazeDataForPoint || gazeDataForPoint.length === 0) {
						failedPoints++;
						return;
					}

					const avgX =
						gazeDataForPoint.reduce((sum: number, g: { x: number }) => sum + g.x, 0) /
						gazeDataForPoint.length;
					const avgY =
						gazeDataForPoint.reduce((sum: number, g: { y: number }) => sum + g.y, 0) /
						gazeDataForPoint.length;

					let closestPointIndex = 0;
					let closestDistance = Infinity;

					validationPointsPixels.forEach((point, index) => {
						const dist = Math.sqrt(
							Math.pow(point.x - avgX, 2) + Math.pow(point.y - avgY, 2)
						);
						if (dist < closestDistance) {
							closestDistance = dist;
							closestPointIndex = index;
						}
					});

					if (closestPointIndex !== targetIndex) {
						failedPoints++;
					}
				}
			);

			return failedPoints > calibrationConfig.failedPointsThreshold;
		},
		[calibrationConfig]
	);

	// Handle validation result checking for recalibration
	const wrappedCompleteTrial = useCallback(
		(response: any, extras?: Partial<TrialResult>) => {
			const currentTrial = runner.currentTrial;

			// Check if this is a validation trial
			if (currentTrial?.type === "validation") {
				const newValidationResults = [...validationResults, { response } as any];
				setValidationResults(newValidationResults);

				// Check if validation failed and we need recalibration
				if (checkValidationFailed(response)) {
					setNeedsRecalibration(true);
					// Don't advance - let the page handle recalibration
					return;
				}
			}

			runner.completeTrial(response, extras);
		},
		[runner, validationResults, checkValidationFailed]
	);

	const triggerRecalibration = useCallback(() => {
		setNeedsRecalibration(false);
		// Reset calibration and re-inject calibration trials
		webgazer.resetCalibration();

		// Insert recalibration trials before current position
		const recalTrials: Trial[] = [
			{
				id: `recal-instructions-${Date.now()}`,
				type: "instruction",
				metadata: {
					content: `
						<p>The accuracy of the calibration is a little lower than we'd like.</p>
						<p>Let's try calibrating one more time.</p>
						<p>On the next screen, look at the dots.</p>
					`,
					buttonText: "OK",
				},
			},
			{
				id: `recalibration-${Date.now()}`,
				type: "calibration",
				metadata: {},
			},
			{
				id: `recal-val-instructions-${Date.now()}`,
				type: "instruction",
				metadata: {
					content: `
						<p>Now we'll measure the accuracy of the calibration.</p>
						<p>Look at each dot as it appears on the screen.</p>
					`,
					buttonText: "Got it",
				},
			},
			{
				id: `revalidation-${Date.now()}`,
				type: "validation",
				metadata: { task: "validate" },
			},
		];

		// Insert after current trial
		const currentIdx = runner.currentTrialIndex;
		const newTrials = [
			...trials.slice(0, currentIdx + 1),
			...recalTrials,
			...trials.slice(currentIdx + 1),
		];
		setTrials(newTrials);

		// Now complete the current (failed) validation trial to advance
		runner.completeTrial(validationResults[validationResults.length - 1]?.response);
	}, [webgazer, runner, trials, validationResults]);

	// Fetch experiment data and build trials
	useEffect(() => {
		if (!shouldStart) return;

		let isMounted = true;
		setIsLoading(true);

		const fetchAndBuild = async () => {
			try {
				const res = isPreview
					? await ExperimentService.fetchExperimentById(experimentId)
					: await ExperimentService.fetchExperimentForParticipant(
							experimentId,
							participantRef.current?.email
								? { email: participantRef.current.email }
								: undefined
					  );

				if (!isMounted) return;

				const experimentData = res.data?.data;
				if (!experimentData?.screens) {
					setError("No screens found in experiment");
					setIsLoading(false);
					return;
				}

				const screens = experimentData.screens as IScreen[];

				// Detect if eye tracking is needed (from components or legacy type)
				const needsEyeTracking = experimentType === "eyetrackingMos" || screensNeedEyeTracking(screens);
				needsEyeTrackingRef.current = needsEyeTracking;

				// Load WebGazer if any screen needs eye tracking
				if (needsEyeTracking) {
					await webgazer.loadWebGazer();
				}

				if (!isMounted) return;

				const { trials: builtTrials, totalAudioTrials: audioCount } = buildTrials(
					screens,
					experimentType
				);

				setTrials(builtTrials);
				setTotalAudioTrials(audioCount);
				setIsLoading(false);
			} catch (err) {
				console.error("Error loading experiment:", err);
				if (isMounted) {
					setError("Failed to load experiment");
					setIsLoading(false);
				}
			}
		};

		fetchAndBuild();

		return () => {
			isMounted = false;
			if (experimentType === "eyetrackingMos" || needsEyeTrackingRef.current) {
				webgazer.cleanup();
			}
		};
	}, [shouldStart, experimentId, experimentType, isPreview]); // eslint-disable-line react-hooks/exhaustive-deps

	const startExperiment = useCallback(() => {
		setShouldStart(true);
	}, []);

	return {
		currentTrial: runner.currentTrial,
		currentTrialIndex: runner.currentTrialIndex,
		totalTrials: runner.totalTrials,
		trialStartTime: runner.trialStartTime,
		completeTrial: wrappedCompleteTrial,
		isLoading,
		isSubmitting,
		isFinished: isFinishedState || runner.isFinished,
		error,
		startExperiment,
		webgazer,
		totalAudioTrials,
		audioTrialCounter,
		calibrationConfig,
		validationResults,
		needsRecalibration,
		triggerRecalibration,
	};
};

export default useExperiment;
