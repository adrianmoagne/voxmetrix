export type MediaType = "audio" | "picture";

// export interface IMedia {
// 	_id: string;
// 	type: MediaType;
// 	fileName: string;
// 	size: number;
// 	url: string;
// 	extension?: string;
// 	created_at: Date;
// 	updated_at?: Date;
// 	used_by?: string[];
// }

export interface IMedia {
	_id: string;
	type: MediaType;
	filename: string; // or keep `filename` if you switch everything to camelCase
	size: number;
	src: string;
	extension?: string;
	createdAt: Date | string; // allow string and parse later
	updated_at?: Date | string;
	used_by?: string[];
}

// export const mockMedias: IMedia[] = [
// 	{
// 		_id: "1",
// 		type: "picture",
// 		filename: "image1.jpg",
// 		// src: "https://img.freepik.com/vetores-gratis/graident-ai-robot-vectorart-em-ingles_78370-4114.jpg?semt=ais_hybrid&w=740",
// 		// src: "/samples/sample-right.svg",
// 		src: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Image_created_with_a_mobile_phone.png",
// 		size: 1024,
// 		created_at: new Date("2023-01-01"),
// 		extension: "jpg",
// 		used_by: ["project1", "project2"],
// 	},
// 	{
// 		_id: "2",
// 		type: "audio",
// 		filename: "audio1.mp3",
// 		src: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3",
// 		size: 2048,
// 		created_at: new Date("2023-02-01"),
// 		extension: "mp3",
// 	},
// ];

export interface IUploadFile {
	fileName: string;
	file: File;
	progress: number;
	status: IUploadFileStatus;
	error?: unknown;
}

export type IUploadFileStatus = "pending" | "uploading" | "completed" | "failed";

export interface IMediaFilters {
	type?: MediaType;
	inUse?: boolean;
}
