import { useState, useCallback, useRef, useEffect } from "react";
import { Button, Typography } from "@leux/ui";
import { useScreenRuntime } from "../ScreenRuntimeContext";

interface TextHighlighterEntityProps {
	uid: string;
	text: string;
	highlightColor?: string;
}

interface HighlightRange {
	start: number;
	end: number;
	text: string;
}

function getCharOffset(container: HTMLElement, node: Node, offset: number): number {
	const range = document.createRange();
	range.selectNodeContents(container);
	range.setEnd(node, offset);
	return range.toString().length;
}

function normalizeRanges(
	ranges: Array<Pick<HighlightRange, "start" | "end">>,
	text: string
): HighlightRange[] {
	if (!ranges.length) return [];

	const sorted = ranges
		.map(({ start, end }) => {
			const from = Math.max(0, Math.min(start, end, text.length));
			const to = Math.max(0, Math.min(Math.max(start, end), text.length));
			return { start: from, end: to };
		})
		.filter(({ start, end }) => start < end)
		.sort((a, b) => a.start - b.start);

	if (!sorted.length) return [];

	const result = [{ ...sorted[0] }];
	for (let i = 1; i < sorted.length; i++) {
		const last = result[result.length - 1];
		if (sorted[i].start <= last.end) {
			last.end = Math.max(last.end, sorted[i].end);
		} else {
			result.push({ ...sorted[i] });
		}
	}

	return result.map(({ start, end }) => ({
		start,
		end,
		text: text.slice(start, end),
	}));
}

const TextHighlighterEntity: React.FC<TextHighlighterEntityProps> = ({
	uid,
	text,
	highlightColor = "#FFEB3B",
}) => {
	const { isEntityInteractive, responseStates, markResponseCompleted } = useScreenRuntime();
	const active = isEntityInteractive(uid);
	const completed = responseStates[uid]?.completed ?? false;
	const [highlights, setHighlights] = useState<HighlightRange[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const selectionHandledRef = useRef(false);

	useEffect(() => {
		setHighlights([]);
	}, [text]);

	const handleRemoveHighlight = useCallback((index: number, event: React.MouseEvent) => {
		event.stopPropagation();
		if (selectionHandledRef.current) return;
		if (!active || completed) return;
		setHighlights((prev) => prev.filter((_, i) => i !== index));
	}, [active, completed]);

	const handleMouseUp = useCallback(() => {
		if (!active || completed) return;
		const selection = window.getSelection();
		if (!selection || selection.isCollapsed || !containerRef.current) return;

		const container = containerRef.current;
		const range = selection.getRangeAt(0);
		if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
			return;
		}

		const start = getCharOffset(container, range.startContainer, range.startOffset);
		const end = getCharOffset(container, range.endContainer, range.endOffset);
		if (start === end) return;

		setHighlights((prev) => normalizeRanges([...prev, { start, end }], text));
		selectionHandledRef.current = true;
		window.setTimeout(() => {
			selectionHandledRef.current = false;
		}, 0);
		selection.removeAllRanges();
	}, [active, completed, text]);

	const handleConfirm = () => {
		const normalizedHighlights = normalizeRanges(highlights, text);
		const highlightedText = normalizedHighlights.map((h) => h.text).join(" ");
		markResponseCompleted(uid, {
			highlights: normalizedHighlights,
			highlightedText,
			fullText: text,
		});
	};

	const renderText = () => {
		const segments: React.ReactNode[] = [];
		let pos = 0;
		highlights.forEach(({ start, end, text: highlightedText }, i) => {
			if (pos < start) {
				segments.push(<span key={`t${i}`}>{text.slice(pos, start)}</span>);
			}
			segments.push(
				<mark
					key={`h${i}`}
					onClick={(event) => handleRemoveHighlight(i, event)}
					style={{ backgroundColor: highlightColor, borderRadius: 2, padding: "2px 0", cursor: "pointer" }}
				>
					{highlightedText}
				</mark>
			);
			pos = end;
		});
		if (pos < text.length) {
			segments.push(<span key="tail">{text.slice(pos)}</span>);
		}
		return segments;
	};

	return (
		<div
			data-entity-uid={uid}
			style={{
				padding: 16,
				opacity: active ? 1 : 0.5,
				pointerEvents: active && !completed ? "auto" : "none",
			}}
		>

			<Typography variant="caption" customStyles={{ marginBottom: 12 }}>
				Select parts of the text that sound notable. Click a highlight to remove it.
			</Typography>
			<div
				ref={containerRef}
				onMouseUp={handleMouseUp}
				style={{
					lineHeight: 2,
					fontSize: 16,
					userSelect: active && !completed ? "text" : "none",
				}}
			>
				{renderText()}
			</div>
			{active && !completed && highlights.length > 0 && (
				<div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
					<Typography variant="caption" textColor="placeholder">
						{highlights.length} highlight{highlights.length !== 1 ? "s" : ""}
					</Typography>
					<Button colorScheme="primary" onClick={handleConfirm}>
						Confirm Selection
					</Button>
				</div>
			)}
		</div>
	);
};

export default TextHighlighterEntity;
