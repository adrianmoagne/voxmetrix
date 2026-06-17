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
	const { markAudioStarted, markAudioCompleted, fixationActive } = useScreenRuntime();
	const eyeTracking = useOptionalEyeTrackingSession();
	const registerActiveAudio = eyeTracking?.registerActiveAudio;
	const unregisterActiveAudio = eyeTracking?.unregisterActiveAudio;
	const playerRef = useRef<AudioPlayerHandle>(null);
	const hasRegisteredPlaybackRef = useRef(false);

	useEffect(() => {
		hasRegisteredPlaybackRef.current = false;
	}, [audioSrc]);

	useEffect(() => {
		if (!audioSrc.trim()) {
			markAudioCompleted(uid);
		}
	}, [audioSrc, markAudioCompleted, uid]);

	const handlePlaying = useCallback(() => {
		markAudioStarted(uid);
		const track = playerRef.current?.getTrack();
		if (!track || hasRegisteredPlaybackRef.current) return;
		hasRegisteredPlaybackRef.current = true;
		registerActiveAudio?.(uid, track);
	}, [markAudioStarted, registerActiveAudio, uid]);

	const handleEnded = useCallback(() => {
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
			onEnded={handleEnded}
		/>
	);

	if (hidden) {
		return player;
	}

	return (
		<div data-entity-uid={uid}>
			{label && (
				<div style={{ fontSize: 12, color: "#666", marginBottom: 4, textAlign: "center" }}>
					{label}
				</div>
			)}
			{player}
		</div>
	);
};

export default AudioPlayerEntity;
