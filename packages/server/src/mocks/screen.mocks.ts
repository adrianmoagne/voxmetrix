import { Types } from "mongoose";
import { TScreen } from "../modules/screen/screen.model";
import { Collections } from "../@types";

// Basic screen with a 1x1 grid and default actions
export const mockBasicScreen = {
	_id: new Types.ObjectId(),
	alias: "basic-screen",
	used_by: [],
	grid: {
		type: "1x1",
		subtype: "equal",
	},
	actions: {
		default: ["back", "next"],
		use_form_actions: new Types.ObjectId(),
		use_media_actions: ["next_on_select"],
	},
	items: [
		{
			type: "text",
			position: "center",
			area: "content",
			v_align: "center",
			h_align: "center",
		},
	],
} as const;

// Complex screen with media and form elements in a 2x2 grid
export const mockComplexScreen = {
	_id: new Types.ObjectId(),
	alias: "complex-screen",
	used_by: [new Types.ObjectId()],
	grid: {
		type: "2x2",
		subtype: "v_centered",
	},
	actions: {
		default: ["continue"],
		use_form_actions: new Types.ObjectId(),
		use_media_actions: ["next_on_select", "link_media_with_form"],
	},
	items: [
		{
			type: "media",
			position: "left",
			area: "heading",
			v_align: "center",
			h_align: "left",
		},
		{
			type: "form",
			position: "right",
			area: "content",
			v_align: "center",
			h_align: "center",
		},
		{
			type: "text",
			position: "center",
			area: "footer",
			v_align: "center",
			h_align: "center",
		},
	],
} as const;

// Screen with a 3x3 grid focused on media content
export const mockMediaScreen = {
	_id: new Types.ObjectId(),
	alias: "media-screen",
	used_by: [],
	grid: {
		type: "3x3",
		subtype: "h_centered",
	},
	actions: {
		default: ["back", "next"],
		use_form_actions: new Types.ObjectId(),
		use_media_actions: ["next_on_select", "allow_unselect"],
	},
	items: [
		{
			type: "media",
			position: "left",
			area: "content",
			v_align: "center",
			h_align: "center",
		},
		{
			type: "media",
			position: "center",
			area: "content",
			v_align: "center",
			h_align: "center",
		},
		{
			type: "media",
			position: "right",
			area: "content",
			v_align: "center",
			h_align: "center",
		},
	],
} as const;

// Template screen with template-type items for reusable layouts
export const mockTemplateScreen = {
	_id: new Types.ObjectId(),
	alias: "template-screen",
	used_by: [],
	grid: {
		type: "3x3",
		subtype: "equal",
	},
	actions: {
		default: ["next"],
		use_form_actions: null,
		use_media_actions: [],
	},
	items: [
		{
			type: "template",
			template_type: "image",
			position: "left",
			area: "heading",
			v_align: "center",
			h_align: "center",
		},
		{
			type: "template",
			template_type: "image",
			position: "right",
			area: "heading",
			v_align: "center",
			h_align: "center",
		},
		{
			type: "template",
			template_type: "audio",
			position: "center",
			area: "content",
			v_align: "center",
			h_align: "center",
		},
	],
} as const;

export const mockScreenFromTemplateRequest = {
	template_id: "68e3dd97098d8fda517e713f",
	screens: [
		{
			image_1: "68c487085d08e5be9be9e9b3",
			image_2: "68d5910c2deccb16a75f8453",
			audio_1: "68c85dde86693884585655a9",
		},
		{
			image_1: "68c487085d08e5be9be9e9b4",
			image_2: "68d5910c2deccb16a75f8454",
			audio_1: "68c85dde86693884585655aa",
		},
	],
};

export const mockScreenList = [
	mockBasicScreen,
	mockComplexScreen,
	mockMediaScreen,
	mockTemplateScreen,
];
