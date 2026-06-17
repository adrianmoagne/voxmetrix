import type { IMedia, IMediaFilters, IUploadFile } from "./medias.model";
import type { IForm } from "./forms.model";
import type {
	GridSubtype,
	GridType,
	ScreenItem,
	ScreenItemPosition,
	ItemArea,
	HAlign,
	VAlign,
	ScreenItemType,
} from "./screen.model";
export interface MediaViewerState {
	selectedMedia: IMedia | null;
	selectedIndex: number;
	medias: IMedia[];
	filters?: IMediaFilters;
}

export interface ScreenState {
	gridType: GridType;
	gridSubtype: GridSubtype;
	items: ScreenItem[];
	enable_tracking?: boolean;
}

export interface SidebarState {
	isCollapsed: boolean;
}

export interface MediaUploadState {
	files: IUploadFile[];
	step: MediaUploadStep;
}

export type MediaUploadStep = "upload" | "sending" | "review";

// AddItem
export type ItemType = "media" | "form" | "text";
export type ItemPosition = "UL" | "UC" | "UR" | "CL" | "C" | "CR" | "BL" | "BC" | "BR";
export type ItemAlignment =
	| "top-left"
	| "top-center"
	| "top-right"
	| "center-left"
	| "center-center"
	| "center-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right";
export type AddItemStep = "media" | "form" | "text";

// Draft kept in AddItem slice while user is adding an item
export interface ScreenDraft {
	media: IMedia | null;
	form: IForm | null;
	type: ScreenItemType | null;
	area: ItemArea | null;
	position: ScreenItemPosition | null;
	v_align: VAlign | null;
	h_align: HAlign | null;
	text?: string | null;
}
