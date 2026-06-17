export type IFormStatus = "enabled" | "disabled";

export type IFormAction = "clear" | "back" | "continue";

export type IFormInputType = "checkbox" | "text" | "textarea" | "radio_group" | "select";

export interface IFormInputOption {
	label: string;
	value: string;
}

export interface IFormInput {
	type: IFormInputType;
	label: string;
	placeholder?: string;
	key: string;
	required?: boolean;
	options?: IFormInputOption[];
}

export interface IForm {
	_id: string;
	alias: string;
	status: IFormStatus;
	actions: IFormAction[];
	inputs: IFormInput[];
	createdAt: string;
	updatedAt: string;
}

export interface IFormCreatePayload {
	alias: string;
	status?: IFormStatus;
	actions?: IFormAction[];
	inputs?: IFormInput[];
}

export interface IFormUpdatePayload {
	alias?: string;
	status?: IFormStatus;
	actions?: IFormAction[];
	inputs?: IFormInput[];
}
