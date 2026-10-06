import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, Radio, Typography, Tooltip } from "@leux/ui";
import type { RatingOption, RatingResponse, RatingScaleLayout } from "@/@types/screen.model";
import { useScreenRuntime } from "../ScreenRuntimeContext";

export const DEFAULT_RATING_CONFIRM_LABEL = "Confirm";
export const DEFAULT_RATING_LOCKED_HINT = "Listen to all the audios";
export const DEFAULT_RATING_LAYOUT: RatingScaleLayout = "vertical";

const optionsContainerStyles: Record<RatingScaleLayout, React.CSSProperties> = {
	vertical: {
		display: "flex",
		justifyContent: "center",
		flexDirection: "column",
		gap: 16,
		marginTop: 12,
	},
	// Equal-width columns on one line, so the scale reads as a continuum. Labels wrap between
	// words inside their column; when the words don't fit, the scale is shown vertically.
	horizontal: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "flex-start",
		gap: 8,
		width: "100%",
		maxWidth: 720,
		margin: "12px auto 0",
	},
};

const horizontalOptionStyles: React.CSSProperties = {
	flex: "1 1 0",
	minWidth: "min-content",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	gap: 6,
};

const horizontalLabelStyles: React.CSSProperties = {
	textAlign: "center",
};

/** The grid cell the entity is placed in (nearest ancestor that is a CSS grid item). */
const findLayoutCell = (element: HTMLElement): HTMLElement => {
	let current = element;
	while (current.parentElement) {
		if (getComputedStyle(current.parentElement).display === "grid") return current;
		current = current.parentElement;
	}
	return document.documentElement;
};

interface RatingScaleEntityProps {
	uid: string;
	prompt: string;
	options: RatingOption[];
	layout?: RatingScaleLayout;
	confirmLabel?: string;
	lockedHint?: string;
}

const RatingScaleEntity: React.FC<RatingScaleEntityProps> = ({
	uid,
	prompt,
	options,
	layout = DEFAULT_RATING_LAYOUT,
	confirmLabel = DEFAULT_RATING_CONFIRM_LABEL,
	lockedHint = DEFAULT_RATING_LOCKED_HINT,
}) => {
	const { isEntityInteractive, responseStates, markResponseSelected, markResponseCompleted } =
		useScreenRuntime();
	const active = isEntityInteractive(uid);
	const completed = responseStates[uid]?.completed ?? false;
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	const entityRef = useRef<HTMLDivElement>(null);
	const optionsRef = useRef<HTMLDivElement>(null);
	const optionsSignature = options.map((option) => option.label).join("\u0000");
	const [verticalFallbackFor, setVerticalFallbackFor] = useState<string | null>(null);
	const [fitCheck, setFitCheck] = useState(0);
	const usesVerticalFallback = layout === "horizontal" && verticalFallbackFor === optionsSignature;
	const shownLayout: RatingScaleLayout = usesVerticalFallback ? "vertical" : layout;

	// Measured before paint, so participants never see a row that doesn't fit. The row must
	// stay inside its grid cell: spilling over would cover neighbouring entities, such as
	// eye-tracking targets.
	useLayoutEffect(() => {
		if (layout !== "horizontal" || usesVerticalFallback) return;
		const entity = entityRef.current;
		const row = optionsRef.current;
		if (!entity || !row) return;

		const cell = findLayoutCell(entity);
		const spillsOutOfCell = entity.getBoundingClientRect().width > cell.clientWidth + 1;
		const overflowsRow = row.scrollWidth > row.clientWidth + 1;
		if (spillsOutOfCell || overflowsRow) {
			setVerticalFallbackFor(optionsSignature);
		}
	}, [layout, optionsSignature, usesVerticalFallback, fitCheck]);

	// Re-check when the cell gets wider or narrower (window resize, grid change). Height is
	// ignored: switching layouts changes the row height, which would otherwise loop.
	useEffect(() => {
		const entity = entityRef.current;
		if (layout !== "horizontal" || !entity) return;
		const cell = findLayoutCell(entity);
		let lastWidth = cell.clientWidth;
		const observer = new ResizeObserver(() => {
			if (cell.clientWidth === lastWidth) return;
			lastWidth = cell.clientWidth;
			setVerticalFallbackFor(null);
			setFitCheck((count) => count + 1);
		});
		observer.observe(cell);
		return () => observer.disconnect();
	}, [layout]);

	const handleSelect = (index: number) => {
		setSelectedIndex(index);
		markResponseSelected(uid);
	};

	const handleConfirm = () => {
		if (selectedIndex === null) return;
		const option = options[selectedIndex];
		if (!option) return;

		const response: RatingResponse = {
			index: selectedIndex,
			value: option.value,
			label: option.label,
		};
		markResponseCompleted(uid, response);
	};

	const lockedButton = (
		<Button colorScheme="primary" state={{ disabled: true }}>
			{confirmLabel}
		</Button>
	);

	return (
		<div
			ref={entityRef}
			data-entity-uid={uid}
			style={{
				textAlign: "center",
				padding: 16,
				opacity: active ? 1 : 0.5,
				pointerEvents: active && !completed ? "auto" : "none",
			}}
		>
			<Typography variant="body-1">{prompt}</Typography>
			<div ref={optionsRef} style={optionsContainerStyles[shownLayout] ?? optionsContainerStyles.vertical}>
				{options.map((option, index) => (
					<Radio
						key={`${index}-${option.label}`}
						fieldKey={`rating-${uid}`}
						value={String(index)}
						label={option.label}
						defaultChecked={selectedIndex === index}
						onChange={() => handleSelect(index)}
						customStyles={shownLayout === "horizontal" ? horizontalOptionStyles : undefined}
						customLabelStyles={shownLayout === "horizontal" ? horizontalLabelStyles : undefined}
					/>
				))}
			</div>
			<div style={{ marginTop: 16, pointerEvents: "auto", display: "flex", justifyContent: "center" }}>
				{!active ? (
					lockedHint ? (
						<Tooltip title={lockedHint} direction="right">
							<span style={{ display: "inline-block" }}>{lockedButton}</span>
						</Tooltip>
					) : (
						lockedButton
					)
				) : (
					<Button
						colorScheme="primary"
						state={{ disabled: selectedIndex === null || completed }}
						onClick={handleConfirm}
					>
						{confirmLabel}
					</Button>
				)}
			</div>
		</div>
	);
};

export default RatingScaleEntity;
