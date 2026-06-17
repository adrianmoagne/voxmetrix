import { useState, useRef, useCallback, useEffect } from "react";
import { Button, Typography } from "@leux/ui";
import { AudioPlayer } from "@/components";

interface Highlight {
	start: number;
	end: number;
	text: string;
}

interface TextHighlightingTrialProps {
	audioSource: string;
	fullText: string;
	audioTrialIndex?: number;
	totalAudioTrials?: number;
	onComplete: (response: { highlights: Highlight[]; full_text: string }) => void;
}

function getCharOffset(container: Node, targetNode: Node, targetOffset: number): number {
	let offset = 0;
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT); // Only consider text nodes for offset calculation
	let node: Text | null;
	while ((node = walker.nextNode() as Text | null)) {
		if (node === targetNode) return offset + targetOffset;
		offset += node.textContent?.length || 0;
	}
	return offset;
}

function mergeHighlights(highlights: Highlight[]): Highlight[] {
	if (highlights.length <= 1) return highlights;
	const sorted = [...highlights].sort((a, b) => a.start - b.start);
	const merged: Highlight[] = [sorted[0]];
	for (let i = 1; i < sorted.length; i++) {
		const last = merged[merged.length - 1];
		if (sorted[i].start <= last.end) {
			last.end = Math.max(last.end, sorted[i].end);
			last.text = sorted[i].text.length > last.text.length ? sorted[i].text : last.text;
		} else {
			merged.push(sorted[i]);
		}
	}
	return merged;
}

type Phase = "playing" | "highlighting";

const TextHighlightingTrial: React.FC<TextHighlightingTrialProps> = ({
	audioSource,
	fullText,
	audioTrialIndex,
	totalAudioTrials,
	onComplete,
}) => {
	const [phase, setPhase] = useState<Phase>("playing");
	const [highlights, setHighlights] = useState<Highlight[]>([]);
	const textContainerRef = useRef<HTMLDivElement>(null);

	// Listen for audio ended event
	useEffect(() => {
		const timer = setTimeout(() => {
			const audioEl = document.querySelector("audio") as HTMLAudioElement;
			if (audioEl) {
				const handleEnded = () => setPhase("highlighting");
				audioEl.addEventListener("ended", handleEnded);
				return () => audioEl.removeEventListener("ended", handleEnded);
			}
		}, 200);
		return () => clearTimeout(timer);
	}, []);

	const handleMouseUp = useCallback(() => {
		if (phase !== "highlighting") return;
		const selection = window.getSelection();
		if (!selection || selection.isCollapsed || !textContainerRef.current) return;

		const range = selection.getRangeAt(0);
		const container = textContainerRef.current;

		// Ensure selection is within our container
		if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
			return;
		}

		const start = getCharOffset(container, range.startContainer, range.startOffset);
		const end = getCharOffset(container, range.endContainer, range.endOffset);

		if (start === end) return;

		const selectedText = fullText.slice(start, end);
		const newHighlights = mergeHighlights([...highlights, { start, end, text: selectedText }]);
		setHighlights(newHighlights);
		selection.removeAllRanges();
	}, [phase, highlights, fullText]);

	const handleHighlightClick = useCallback(
		(index: number, e: React.MouseEvent) => {
			// Only remove if not actively selecting
			const selection = window.getSelection();
			if (selection && !selection.isCollapsed) return;
			e.stopPropagation();
			setHighlights((prev) => prev.filter((_, i) => i !== index));
		},
		[]
	);

	const handleConfirm = () => {
		onComplete({ highlights, full_text: fullText });
	};

	// Build segments for rendering
	const renderText = () => {
		if (highlights.length === 0) {
			return <span>{fullText}</span>;
		}

		const sorted = [...highlights].sort((a, b) => a.start - b.start);
		const segments: React.ReactNode[] = [];
		let lastEnd = 0;

		sorted.forEach((h, i) => {
			if (h.start > lastEnd) {
				segments.push(<span key={`plain-${i}`}>{fullText.slice(lastEnd, h.start)}</span>);
			}
			segments.push(
				<mark
					key={`highlight-${i}`}
					onClick={(e) => handleHighlightClick(i, e)}
					style={{
						backgroundColor: "#fbbf24",
						borderRadius: 2,
						cursor: "pointer",
						padding: "0 1px",
					}}
					title="Click to remove"
				>
					{fullText.slice(h.start, h.end)}
				</mark>
			);
			lastEnd = h.end;
		});

		if (lastEnd < fullText.length) {
			segments.push(<span key="plain-last">{fullText.slice(lastEnd)}</span>);
		}

		return segments;
	};

	return (
		<div style={{ margin: "0 auto", textAlign: "center", maxWidth: 700, padding: "20px" }}>
			{audioTrialIndex != null && totalAudioTrials != null && (
				<div style={{ marginBottom: 8 }}>
					<Typography variant="caption">
						Audio {audioTrialIndex} / {totalAudioTrials}
					</Typography>
				</div>
			)}

			<div style={{ marginBottom: 24 }}>
				<AudioPlayer src={audioSource} />
			</div>

			{phase === "playing" && (
				<Typography variant="caption" textColor="placeholder" customStyles={{ marginBottom: 12 }}>
					Listen to the audio. Text highlighting will be enabled after playback ends.
				</Typography>
			)}

			{phase === "highlighting" && (
				<Typography variant="caption" customStyles={{ marginBottom: 12 }}>
					Select parts of the text that sound notable. Click a highlight to remove it.
				</Typography>
			)}

			<div
				ref={textContainerRef}
				onMouseUp={handleMouseUp}
				style={{
					textAlign: "left",
					fontSize: 18,
					lineHeight: 1.8,
					padding: 24,
					border: "1px solid #e5e7eb",
					borderRadius: 8,
					marginTop: 16,
					userSelect: phase === "highlighting" ? "text" : "none",
					WebkitUserSelect: phase === "highlighting" ? "text" : "none",
					cursor: phase === "highlighting" ? "text" : "default",
					background: phase === "highlighting" ? "#fefce8" : "#f9fafb",
					transition: "background 0.3s",
				}}
			>
				{renderText()}
			</div>

			{phase === "highlighting" && (
				<div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
					{highlights.length > 0 && (
						<Typography variant="caption" textColor="placeholder">
							{highlights.length} highlight{highlights.length !== 1 ? "s" : ""}
						</Typography>
					)}
					<Button colorScheme="primary" onClick={handleConfirm}>
						Confirm
					</Button>
				</div>
			)}
		</div>
	);
};

export default TextHighlightingTrial;
