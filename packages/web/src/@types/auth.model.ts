export interface ILoginPayload {
	email: string;
	password: string;
}

export interface ISignUpPayload {
	email: string;
	password: string;
	name: string;
	work: string;
	phone: string;
	description?: string;
}

export interface IUser {
	_id: string;
	name: string;
	username: string;
	email: string;
	institution?: string;
	phone?: string;
	description?: string;
	created_at?: string;
}

export interface AuthState {
	user: IUser | null;
	loading: boolean;
	error?: string | null;
}
