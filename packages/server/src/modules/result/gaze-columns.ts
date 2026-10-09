/**
 * Lossless compact storage for arrays of flat records such as gaze samples and clock
 * anchors. One column per field instead of one object per record: numbers are packed as
 * float64 (exact for any JS number), repeated strings go through a dictionary, and a
 * field with the same value in every record is stored once. Field names are stored once
 * per table instead of once per record, which is most of the saving.
 */

type JsonRecord = Record<string, unknown>;

/** Per-row state of a column: the field was absent, null, or held a value. */
const ABSENT = 0;
const NULL = 1;
const VALUE = 2;

const MAX_DICTIONARY = 0xffff;

type Column =
	| { t: "const"; value: unknown }
	| { t: "f64"; data: Buffer; state?: Buffer }
	| { t: "dict"; dict: string[]; idx: Buffer; state?: Buffer }
	| { t: "raw"; values: unknown[]; state?: Buffer };

export interface ColumnarTable {
	columnar: 1;
	n: number;
	/** Field names in first-seen order; decoded records list their fields in this order. */
	keys: string[];
	cols: Record<string, Column>;
}

const isRecord = (value: unknown): value is JsonRecord =>
	!!value && typeof value === "object" && !Array.isArray(value) && !Buffer.isBuffer(value);

const isPrimitive = (value: unknown): boolean =>
	value === null || ["string", "number", "boolean"].includes(typeof value);

export const isColumnarTable = (value: unknown): value is ColumnarTable =>
	isRecord(value) && value.columnar === 1 && typeof value.n === "number" && isRecord(value.cols);

/** Buffers come back from MongoDB as BSON `Binary`, whose bytes are under `buffer`. */
const toBuffer = (value: unknown): Buffer => {
	if (Buffer.isBuffer(value)) return value;
	const bytes = (value as { buffer?: Uint8Array } | undefined)?.buffer;
	if (bytes instanceof Uint8Array) return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	throw new Error("Columnar gaze data: expected binary column data");
};

const encodeColumn = (records: JsonRecord[], key: string): Column => {
	const n = records.length;
	const state = Buffer.alloc(n);
	const values: unknown[] = new Array(n);
	for (let row = 0; row < n; row += 1) {
		const record = records[row];
		// As in JSON, an undefined value is the same as a missing field.
		if (record[key] === undefined) {
			state[row] = ABSENT;
			values[row] = null;
		} else if (record[key] === null) {
			state[row] = NULL;
			values[row] = null;
		} else {
			state[row] = VALUE;
			values[row] = record[key];
		}
	}

	const allPresent = state.every((rowState) => rowState !== ABSENT);
	if (allPresent && isPrimitive(records[0][key])) {
		const first = records[0][key];
		if (records.every((record) => Object.is(record[key], first))) return { t: "const", value: first };
	}

	const allValues = state.every((rowState) => rowState === VALUE);
	const withState = <T extends object>(column: T): T & { state?: Buffer } =>
		allValues ? column : { ...column, state };
	const present = values.filter((_, row) => state[row] === VALUE);

	if (present.every((value) => typeof value === "number")) {
		const data = Buffer.alloc(n * 8);
		values.forEach((value, row) => {
			if (state[row] === VALUE) data.writeDoubleLE(value as number, row * 8);
		});
		return withState({ t: "f64" as const, data });
	}

	if (present.every((value) => typeof value === "string")) {
		const dict = [...new Set(present as string[])];
		if (dict.length <= MAX_DICTIONARY) {
			const position = new Map(dict.map((value, index) => [value, index]));
			const idx = Buffer.alloc(n * 2);
			values.forEach((value, row) => {
				if (state[row] === VALUE) idx.writeUInt16LE(position.get(value as string)!, row * 2);
			});
			return withState({ t: "dict" as const, dict, idx });
		}
	}

	return withState({ t: "raw" as const, values });
};

/** Columnar form of `records`, or null when they are not all plain objects (kept as they are). */
export const encodeRecords = (records: unknown[]): ColumnarTable | null => {
	if (records.length === 0 || !records.every(isRecord)) return null;

	const keys: string[] = [];
	const seen = new Set<string>();
	for (const record of records as JsonRecord[]) {
		for (const key of Object.keys(record)) {
			if (record[key] !== undefined && !seen.has(key)) {
				seen.add(key);
				keys.push(key);
			}
		}
	}

	const cols: Record<string, Column> = {};
	for (const key of keys) cols[key] = encodeColumn(records as JsonRecord[], key);
	return { columnar: 1, n: records.length, keys, cols };
};

export const decodeRecords = (table: ColumnarTable): JsonRecord[] => {
	const records: JsonRecord[] = Array.from({ length: table.n }, () => ({}));

	for (const key of table.keys) {
		const column = table.cols[key];
		if (column.t === "const") {
			for (const record of records) record[key] = column.value;
			continue;
		}

		const state = column.state ? toBuffer(column.state) : null;
		const data = column.t === "f64" ? toBuffer(column.data) : null;
		const idx = column.t === "dict" ? toBuffer(column.idx) : null;
		for (let row = 0; row < table.n; row += 1) {
			const rowState = state ? state[row] : VALUE;
			if (rowState === ABSENT) continue;
			if (rowState === NULL) {
				records[row][key] = null;
			} else if (column.t === "f64") {
				records[row][key] = data!.readDoubleLE(row * 8);
			} else if (column.t === "dict") {
				records[row][key] = column.dict[idx!.readUInt16LE(row * 2)];
			} else {
				records[row][key] = column.values[row];
			}
		}
	}

	return records;
};

/** Encodes `records` when possible; the stored value decodes with `decodeStored`. */
export const encodeStored = (records: unknown[]): unknown => encodeRecords(records) ?? records;

export const decodeStored = (value: unknown): unknown =>
	isColumnarTable(value) ? decodeRecords(value) : value;