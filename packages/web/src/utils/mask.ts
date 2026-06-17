export const maskPhoneNumber = (value: string): string => {
	const digits = value.replace(/\D/g, "").slice(0, 11);

	const ddd = digits.slice(0, 2);
	const part1 = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
	const part2 = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);

	let formatted = "";
	if (ddd) formatted += `(${ddd}`;
	if (digits.length >= 2) formatted += ") ";
	if (part1) formatted += part1;
	if (part2) formatted += `-${part2}`;

	return formatted;
};

// function that receives a file in bytes like 1234567 and returns a human readable string like "100 kb" "1.23 MB" or "1 GB"
export const formatFileSize = (sizeInBytes: number): string => {
	if (sizeInBytes < 1024) {
		return `${sizeInBytes} B`;
	} else if (sizeInBytes < 1048576) {
		return `${(sizeInBytes / 1024).toFixed(2)} KB`;
	} else if (sizeInBytes < 1073741824) {
		return `${(sizeInBytes / 1048576).toFixed(2)} MB`;
	} else {
		return `${(sizeInBytes / 1073741824).toFixed(2)} GB`;
	}
};
