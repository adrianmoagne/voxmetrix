export interface GenericAction<T = unknown> {
	type: string;
	payload: T;
}
