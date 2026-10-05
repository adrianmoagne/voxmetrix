import type { CSSProperties, ReactNode } from "react";
import { renderInlineMarkdown } from "./renderInlineMarkdown";


//   # / ## / ###   headings (sized relative to the base font size)
//   blank line     new paragraph
//   single newline line break
//   - item         bullet list
//   1. item        numbered list
//   **bold**, *italic*

type TextBlock =
	| { type: "heading"; level: 1 | 2 | 3; text: string }
	| { type: "paragraph"; lines: string[] }
	| { type: "list"; ordered: boolean; items: string[] };

const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/; // Matches #, ##, or ### followed by text
const BULLET_PATTERN = /^\s*-\s+(.*)$/; // Matches - followed by text
const ORDERED_PATTERN = /^\s*\d+[.)]\s+(.*)$/; // Matches 1. or 1) followed by text

const HEADING_FONT_SCALE: Record<1 | 2 | 3, string> = {
	1: "1.6em",
	2: "1.35em",
	3: "1.15em",
};

export const parseTextBlocks = (value: string): TextBlock[] => {
	const blocks: TextBlock[] = [];
	let current: TextBlock | null = null;

	const closeBlock = () => {
		if (current) blocks.push(current);
		current = null;
	};

	const pushListItem = (ordered: boolean, item: string) => {
		if (current?.type === "list" && current.ordered === ordered) {
			current.items.push(item);
			return;
		}
		closeBlock();
		current = { type: "list", ordered, items: [item] };
	};

	for (const line of value.split(/\r?\n/)) {
		if (!line.trim()) {
			closeBlock();
			continue;
		}

		const heading = HEADING_PATTERN.exec(line);
		if (heading) {
			closeBlock();
			blocks.push({
				type: "heading",
				level: heading[1].length as 1 | 2 | 3,
				text: heading[2].trim(),
			});
			continue;
		}

		const bullet = BULLET_PATTERN.exec(line);
		if (bullet) {
			pushListItem(false, bullet[1]);
			continue;
		}

		const ordered = ORDERED_PATTERN.exec(line);
		if (ordered) {
			pushListItem(true, ordered[1]);
			continue;
		}

		if (current?.type === "paragraph") {
			current.lines.push(line);
		} else {
			closeBlock();
			current = { type: "paragraph", lines: [line] };
		}
	}

	closeBlock();
	return blocks;
};

interface RenderTextMarkdownOptions {
	align?: "left" | "center" | "right";
}

export const renderTextMarkdown = (
	value: string,
	{ align = "left" }: RenderTextMarkdownOptions = {}
): ReactNode => {
	if (!value) return value;


	const listStyle: CSSProperties =
		align === "left"
			? { paddingLeft: "1.25em", listStylePosition: "outside" }
			: { paddingLeft: 0, listStylePosition: "inside" };

	return parseTextBlocks(value).map((block, index) => {
		const spacing: CSSProperties = {
			margin: 0,
			marginTop: index === 0 ? 0 : "0.75em",
			fontFamily: "inherit",
			fontSize: "inherit",
			fontWeight: "inherit",
			lineHeight: "inherit",
		};

		switch (block.type) {
			case "heading": {
				const Heading = `h${block.level}` as const;
				return (
					<Heading
						key={index}
						style={{
							...spacing,
							fontSize: HEADING_FONT_SCALE[block.level],
							fontWeight: 600,
							lineHeight: 1.25,
						}}
					>
						{renderInlineMarkdown(block.text)}
					</Heading>
				);
			}

			case "list": {
				const List = block.ordered ? "ol" : "ul";
				return (
					<List key={index} style={{ ...spacing, ...listStyle }}>
						{block.items.map((item, itemIndex) => (
							<li key={itemIndex}>{renderInlineMarkdown(item)}</li>
						))}
					</List>
				);
			}

			case "paragraph":
				return (
					<p key={index} style={spacing}>
						{block.lines.map((line, lineIndex) => (
							<span key={lineIndex}>
								{lineIndex > 0 && <br />}
								{renderInlineMarkdown(line)}
							</span>
						))}
					</p>
				);
		}
	});
};
