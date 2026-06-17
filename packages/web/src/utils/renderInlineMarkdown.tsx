import type { ReactNode } from "react";

const findItalicClosingMarker = (value: string, startIndex: number): number => {
	for (let index = startIndex; index < value.length; index += 1) {
		if (value[index] !== "*") continue;
		if (value[index - 1] === "*" || value[index + 1] === "*") continue;
		return index;
	}

	return -1;
};

export const renderInlineMarkdown = (value: string): ReactNode => {
	if (!value) return value;

	const parts: ReactNode[] = [];
	let buffer = "";
	let key = 0;
	let index = 0;

	const pushBuffer = () => {
		if (!buffer) return;
		parts.push(buffer);
		buffer = "";
	};

	while (index < value.length) {
		if (value.startsWith("**", index)) {
			const closingIndex = value.indexOf("**", index + 2);
			if (closingIndex > index + 2) {
				pushBuffer();
				parts.push(
					<strong key={`strong-${key}`}>
						{value.slice(index + 2, closingIndex)}
					</strong>
				);
				key += 1;
				index = closingIndex + 2;
				continue;
			}
		}

		if (value[index] === "*" && value[index + 1] !== "*" && value[index - 1] !== "*") {
			const closingIndex = findItalicClosingMarker(value, index + 1);
			if (closingIndex > index + 1) {
				pushBuffer();
				parts.push(
					<em key={`em-${key}`}>
						{value.slice(index + 1, closingIndex)}
					</em>
				);
				key += 1;
				index = closingIndex + 1;
				continue;
			}
		}

		buffer += value[index];
		index += 1;
	}

	pushBuffer();

	return parts.length > 0 ? parts : value;
};
