import mongoose, { Types } from "mongoose";
import { TMedia } from "../modules/media/media.model";
import { Collections } from "../@types";

// Helper function to create empty DocumentArray for used_by field
const createEmptyDocumentArray = () => {
	return new mongoose.Types.DocumentArray([] as any[]);
};

export const mockAudioMedia = {
	_id: new Types.ObjectId(),
	alias: "test-audio",
	type: "audio" as const,
	used_by: createEmptyDocumentArray(),
	src: "https://example.com/audio/test.mp3",
	filename: "test-audio.mp3",
	original_name: "original-test-audio.mp3",
	extension: "mp3",
	size: 1024 * 1024, // 1MB
	createdAt: new Date(),
	updatedAt: new Date(),
} as const;

export const mockPictureMedia = {
	_id: new Types.ObjectId(),
	alias: "test-picture",
	type: "picture" as const,
	used_by: createEmptyDocumentArray(),
	src: "https://example.com/images/test.jpg",
	filename: "test-picture.jpg",
	original_name: "original-test-picture.jpg",
	extension: "jpg",
	size: 512 * 1024, // 512KB
	createdAt: new Date(),
	updatedAt: new Date(),
} as const;

export const mockMediaList = [mockAudioMedia, mockPictureMedia];
