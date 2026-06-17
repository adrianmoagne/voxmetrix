import {
	useRef,
	useState,
	useEffect,
	useImperativeHandle,
	forwardRef,
	useCallback,
} from "react";
import { Play, Pause } from "react-feather";
import { createWebAudioTrack, type WebAudioTrack } from "@/utils/webAudioPlayback";

interface AudioPlayerProps {
	src: string;
	autoPlay?: boolean;
	hidden?: boolean;
	onEnded?: () => void;
	onPlaying?: () => void;
}

export interface  AudioPlayerHandle {
	play: () => Promise<void>;
	pause: () => void;
	getTrack: () => WebAudioTrack | null;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
	({ src, autoPlay = false, hidden = false, onEnded, onPlaying }, ref) => {
		const [isPlaying, setIsPlaying] = useState(false);
		const trackRef = useRef<WebAudioTrack | null>(null);
		const progressFillRef = useRef<HTMLDivElement | null>(null);
		const onEndedRef = useRef(onEnded);
		const onPlayingRef = useRef(onPlaying);

		const setBarProgress = useCallback((value: number) => {
			if (progressFillRef.current) {
				progressFillRef.current.style.width = `${value}%`;
			}
		}, []);

		useEffect(() => {
			onEndedRef.current = onEnded;
			onPlayingRef.current = onPlaying;
		}, [onEnded, onPlaying]);

		useEffect(() => {
			const track = createWebAudioTrack(src);
			trackRef.current = track;
			setIsPlaying(false);
			setBarProgress(0);

			track.setOnProgress(setBarProgress);

			track.setOnPlaying(() => {
				setIsPlaying(true);
				onPlayingRef.current?.();
			});

			track.setOnEnded(() => {
				setIsPlaying(false);
				setBarProgress(100);
				onEndedRef.current?.();
			});

			void track.preload().catch(console.error);

			return () => {
				track.setOnProgress(null);
				track.dispose();
				if (trackRef.current === track) {
					trackRef.current = null;
				}
			};
		}, [src, setBarProgress]);

		useImperativeHandle(ref, () => ({
			play: async () => {
				await trackRef.current?.play();
			},
			pause: () => {
				trackRef.current?.pause();
				setIsPlaying(false);
			},
			getTrack: () => trackRef.current,
		}));

		useEffect(() => {
			if (!autoPlay || !trackRef.current) return;

			let cancelled = false;

			trackRef.current
				.preload()
				.then(() => {
					if (!cancelled) return trackRef.current?.play();
				})
				.catch(console.error);

			return () => {
				cancelled = true;
				trackRef.current?.pause();
			};
		}, [autoPlay, src]);

		const togglePlay = () => {
			const track = trackRef.current;
			if (!track) return;

			if (isPlaying) {
				track.pause();
				setIsPlaying(false);
			} else {
				track.play().catch(console.error);
			}
		};

		if (hidden) {
			return null;
		}

		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					backgroundColor: "#f8f9fa",
					borderRadius: "100px",
					padding: "10px 24px",
					width: "442px",
					border: "1px solid #eaeaea",
					gap: "16px",
				}}
			>
				<div
					onClick={togglePlay}
					style={{
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						color: "#444",
					}}
				>
					{isPlaying ? (
						<Pause fill="currentColor" width={16} height={16} />
					) : (
						<Play fill="currentColor" width={16} height={16} />
					)}
				</div>

				<div
					style={{
						flexGrow: 1,
						position: "relative",
						height: 10,
						borderRadius: 10,
						backgroundColor: "var(--le-color-border, #e0e0e0)",
						overflow: "hidden",
					}}
				>
					<div
						ref={progressFillRef}
						style={{
							width: "0%",
							height: "100%",
							borderRadius: 10,
							backgroundColor: "#5d69d9",
							transition: "width 0.1s linear",
						}}
					/>
				</div>
			</div>
		);
	}
);

export default AudioPlayer;
