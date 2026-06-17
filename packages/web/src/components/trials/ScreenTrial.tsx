import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Radio, Typography } from "@leux/ui";
import { ScreenRenderer } from "@/components/ScreenRenderer";
import type { IScreen } from "@/@types";
import type { UseWebGazerReturn } from "@/hooks/useWebGazer";

const MOS_SCALE = ["1", "2", "3", "4", "5"];

interface ScreenTrialProps {
	screen: IScreen;
	onComplete: (response: any, extras?: any) => void;
	webgazer?: UseWebGazerReturn;
	trackGaze?: boolean;
	containerStyle?: React.CSSProperties;
}

const ScreenTrial: React.FC<ScreenTrialProps> = ({
	screen,
	onComplete,
	webgazer,
	trackGaze = false,
	containerStyle,
}) => {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const gazeStartedRef = useRef(false);
	const completedRef = useRef(false);
	const [audioEnded, setAudioEnded] = useState(false);
	const [selectedRating, setSelectedRating] = useState<string | null>(null);

	const hasComp = (type: string) => screen.components?.some((c) => c.type === type) ?? false;
	const hasAudioRating = hasComp("audio-rating");
	const hasContinueButton = hasComp("advance-continue");

	const audioItem = screen.items.find(
		(item) =>
			item.type === "media" &&
			typeof item.media !== "string" &&
			item.media?.type === "audio"
	);
	const hasAudio = audioItem && typeof audioItem.media !== "string" && audioItem.media?.src;

	const pictureItems = screen.items.filter(
		(item) =>
			item.type === "media" &&
			typeof item.media !== "string" &&
			item.media?.type === "picture"
	);

	const formItem = screen.items.find((item) => item.type === "form" && item.form);

	const handleComplete = useCallback((response: any) => {
		if (completedRef.current) return;
		completedRef.current = true;

		let gazeData: { x: number; y: number; t: number }[] | undefined;
		if (trackGaze && webgazer) {
			gazeData = webgazer.stopTracking();

			// Trim gaze data to actual audio duration
			const audioEl = audioRef.current;
			if (audioEl && gazeData) {
				const durationMs = audioEl.duration * 1000;
				gazeData = gazeData.filter((p) => p.t <= durationMs);
			}
		}

		// Capture image bounding boxes while DOM is still mounted
		const extras: any = {};
		if (gazeData) {
			extras.gazeData = gazeData;
		}

		if (gazeData && pictureItems.length > 0) {
			extras.targetBoundingBoxes = pictureItems
				.map((item) => {
					const media = typeof item.media !== "string" ? item.media : null;
					if (!media?._id) return null;
					const el = document.getElementById(`item-${media._id}`);
					if (!el) return null;
					const box = el.getBoundingClientRect();
					return {
						imageId: media._id,
						filename: media.filename,
						boundingBox: { left: box.left, right: box.right, top: box.top, bottom: box.bottom },
					};
				})
				.filter(Boolean);
		}

		onComplete(response, extras);
	}, [trackGaze, webgazer, pictureItems.length, onComplete]);

	// Start gaze tracking on mount only for non-audio trials
	useEffect(() => {
		if (trackGaze && webgazer && !hasAudio && !gazeStartedRef.current) {
			gazeStartedRef.current = true;
			webgazer.startTracking();
		}
	}, [trackGaze, webgazer, hasAudio]);

	// Handle audio playback
	useEffect(() => {
		if (!hasAudio) return;

		const audioSrc = typeof audioItem!.media !== "string" ? audioItem!.media!.src! : "";

		const setupAudio = (audioEl: HTMLAudioElement) => {
			audioRef.current = audioEl;

			const handleEnded = () => {
				if (hasAudioRating) {
					setAudioEnded(true);
				} else {
					handleComplete({ audioEnded: true });
				}
			};

			audioEl.addEventListener("ended", handleEnded);

			// Start gaze tracking when audio actually starts playing
			if (trackGaze && webgazer && !gazeStartedRef.current) {
				audioEl.addEventListener("playing", () => {
					gazeStartedRef.current = true;
					webgazer.startTracking();
				}, { once: true });
			}

			if (trackGaze) {
				audioEl.play().catch(console.error);
			}

			return () => {
				audioEl.removeEventListener("ended", handleEnded);
			};
		};

		if (trackGaze) {
			// Eye tracking mode: create audio element programmatically (no visible player)
			const audioEl = new Audio(audioSrc);
			return setupAudio(audioEl);
		} else {
			// Non-tracking mode: find the rendered AudioPlayer element
			const timer = setTimeout(() => {
				const audioEl = document.querySelector("audio") as HTMLAudioElement;
				if (audioEl) setupAudio(audioEl);
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [hasAudio, trackGaze, webgazer, handleComplete, hasAudioRating]);

	const handleFormSubmit = (data: Record<string, any>) => {
		handleComplete({ formData: data });
	};

	const handleFormBack = () => {
		handleComplete({ formBack: true });
	};

	// Use component config when available; fall back to heuristic for legacy screens
	const hasComponentsConfig = screen.components !== undefined;
	const showContinueButton = hasComponentsConfig ? hasContinueButton : !hasAudio && !formItem;
	const showRatingScale = hasAudioRating && audioEnded;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				cursor: trackGaze ? "none" : "auto",
				...containerStyle,
			}}
		>
			<ScreenRenderer
				screen={screen}
				mode="runtime"
				onFormSubmit={handleFormSubmit}
				onFormBack={handleFormBack}
				enableTargetIds={trackGaze}
			/>

			{showRatingScale && (
				<div style={{ textAlign: "center", padding: 24 }}>
					<Typography>Rate the audio quality</Typography>
					<div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
						{MOS_SCALE.map((v) => (
							<Radio
								key={v}
								fieldKey="mos"
								value={v}
								label={v}
								defaultChecked={selectedRating === v}
								onChange={(e: string | { value?: string; target?: { value?: string } }) => {
									const val = typeof e === "string" ? e : e?.target?.value ?? e?.value ?? null;
									setSelectedRating(val);
								}}
							/>
						))}
					</div>
					<div style={{ marginTop: 16 }}>
						<Button
							colorScheme="primary"
							state={{ disabled: selectedRating === null }}
							onClick={() => handleComplete({ response: selectedRating })}
						>
							Confirm
						</Button>
					</div>
				</div>
			)}

			{showContinueButton && (
				<div style={{ textAlign: "center", padding: 24 }}>
					<Button colorScheme="primary" onClick={() => handleComplete({ continue: true })}>
						Continue
					</Button>
				</div>
			)}
		</div>
	);
};

export default ScreenTrial;
