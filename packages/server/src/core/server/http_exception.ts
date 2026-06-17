import { SystemErrors, TSystemErrors } from "src/@types";

export class HttpException extends Error {
	constructor(public status: number, public exception_code: TSystemErrors) {
		super();

		if (SystemErrors[exception_code]) {
			super.message = SystemErrors[exception_code];
		}
	}
}
