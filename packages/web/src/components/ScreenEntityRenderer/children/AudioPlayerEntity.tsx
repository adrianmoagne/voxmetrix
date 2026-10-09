import { useCallback, useEffect, useRef } from "react";
import AudioPlayer, { type AudioPlayerHandle } from "@/components/AudioPlayer/AudioPlayer";
import { useOptionalEyeTrackingSession } from "@/components/StepRunner/EyeTrackingSessionContext";
import { useScreenRuntime } from "../ScreenRuntimeContext";

interface AudioPlayerEntityProps {
	uid: string;
	audioSrc: string;
	label?: string;
	autoplay?: boolean;
	hidden?: boolean;
}

const AudioPlayerEntity: React.FC<AudioPlayerEntityProps> = ({
	uid,
	audioSrc,
	label,
	autoplay = false,
	hidden = false,
}) => {
	const { markAudioStarted, markAudioPaused, markAudioCompleted, fixationActive } =
		useScreenRuntime();
	const eyeTracking = useOptionalEyeTrackingSession();
	const registerActiveAudio = eyeTracking?.registerActiveAudio;
	const unregisterActiveAudio = eyeTracking?.unregisterActiveAudio;
	const playerRef = useRef<AudioPlayerHandle>(null);
	const hasRegisteredPlaybackRef = useRef(false);
	// The next "playing" event starts from the beginning (first play or replay after the end)
	// rather than resuming after a pause.
	const nextPlayFromStartRef = useRef(true);

	useEffect(() => {
		hasRegisteredPlaybackRef.current = false;
		nextPlayFromStartRef.current = true;
	}, [audioSrc]);

	useEffect(() => {
		if (!audioSrc.trim()) {
			markAudioCompleted(uid);
		}
	}, [audioSrc, markAudioCompleted, uid]);

	const handlePlaying = useCallback(() => {
		markAudioStarted(uid, nextPlayFromStartRef.current);
		nextPlayFromStartRef.current = false;
		const track = playerRef.current?.getTrack();
		if (!track || hasRegisteredPlaybackRef.current) return;
		hasRegisteredPlaybackRef.current = true;
		registerActiveAudio?.(uid, track);
	}, [markAudioStarted, registerActiveAudio, uid]);

	const handlePause = useCallback(() => {
		markAudioPaused(uid);
	}, [markAudioPaused, uid]);

	const handleEnded = useCallback(() => {
		nextPlayFromStartRef.current = true;
		markAudioCompleted(uid);
		unregisterActiveAudio?.(uid);
	}, [markAudioCompleted, unregisterActiveAudio, uid]);

	useEffect(() => {
		return () => unregisterActiveAudio?.(uid);
	}, [unregisterActiveAudio, uid]);

	const shouldAutoPlay = autoplay && !fixationActive;

	const player = (
		<AudioPlayer
			ref={playerRef}
			src={audioSrc}
			autoPlay={shouldAutoPlay}
			hidden={hidden}
			onPlaying={handlePlaying}
			onPause={handlePause}
			onEnded={handleEnded}
		/>
	);

	if (hidden) {
		return player;
	}

	return (
		<div data-entity-uid={uid}>
			{label && (
				<div
					style={{
						fontSize: 16,
						fontWeight: 500,
						color: "#333",
						marginBottom: 6,
						textAlign: "center",
					}}
				>
					{label}
				</div>
			)}
			{player}
		</div>
	);
};

export default AudioPlayerEntity;
