import mongoose from "mongoose";
import { decodeRecords, decodeStored, encodeRecords, encodeStored } from "./gaze-columns";

const { BSON } = mongoose.mongo;

const roundTrip = (records: unknown[]) => decodeRecords(encodeRecords(records)!);

/** As stored and read back by MongoDB, where buffers become BSON Binary. */
const throughBson = (records: unknown[]) =>
	decodeStored(BSON.deserialize(BSON.serialize({ value: encodeStored(records) })).value);

describe("gaze columns", () => {
	const frames = [
		{ x: 812.4, y: 433.1, t: 123456.789, status: "ok", audioUid: "audio-1", frameId: 7, audioTime: 0.0333 },
		{ x: null, y: null, t: 123490.1, status: "no_face", audioUid: "audio-1", frameId: 8 },
		{ x: -3.5e-7, y: 1e21, t: 123523.4, status: "ok", audioUid: "audio-1", frameId: 9, audioClock: "stale" },
	];

	it("restores records exactly, including nulls and missing fields", () => {
		expect(roundTrip(frames)).toEqual(frames);
		expect(throughBson(frames)).toEqual(frames);
	});

	it("treats undefined values as missing fields, as JSON does", () => {
		expect(roundTrip([{ x: 1, y: undefined }, { x: undefined, y: 2 }])).toEqual([{ x: 1 }, { y: 2 }]);
		expect(Object.keys(roundTrip([{ x: 1, y: undefined }])[0])).toEqual(["x"]);
	});

	it("keeps fields with mixed or nested values", () => {
		const records = [
			{ flag: true, extra: { nested: [1, 2] }, mixed: 1 },
			{ flag: false, extra: null, mixed: "one" },
			{ mixed: null },
		];
		expect(roundTrip(records)).toEqual(records);
		expect(throughBson(records)).toEqual(records);
	});

	it("stores a value shared by every record once", () => {
		const table = encodeRecords(frames)!;
		expect(table.cols.audioUid).toEqual({ t: "const", value: "audio-1" });
		expect(table.cols.status.t).toBe("dict");
		expect(table.cols.x.t).toBe("f64");
	});

	it("leaves arrays that are not records as they are", () => {
		expect(encodeRecords([])).toBeNull();
		expect(encodeRecords([1, 2])).toBeNull();
		expect(encodeStored([[1, 2]])).toEqual([[1, 2]]);
		expect(decodeStored([{ x: 1 }])).toEqual([{ x: 1 }]);
	});

	it("is several times smaller than one object per record", () => {
		const many = Array.from({ length: 200 }, (_, i) => ({
			x: 400 + i,
			y: 300 - i,
			t: 1000 + i * 33.3,
			tSource: "captureTime",
			frameIdentity: i % 10 ? "exact" : "catchup",
			status: "ok",
			audioUid: "aeadc7b8-cee1-487f-a192-6c63269fac2d",
			audioTime: i * 0.0333,
		}));
		const plain = BSON.calculateObjectSize({ value: many });
		const columnar = BSON.calculateObjectSize({ value: encodeStored(many) });
		expect(columnar).toBeLessThan(plain / 3);
	});
});