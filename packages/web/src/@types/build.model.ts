type IFormAction = "clear" | "back" | "continue";

export interface IBuild {
	_id: string;
	alias: string;
	used_in: number;
	participants: number;
	experiments: number;
	created_at: string;
	actions?: IFormAction[];
}

export const buildsMock: IBuild[] = [
	{
		_id: "1",
		alias: "Build 1",
		used_in: 5,
		participants: 10,
		experiments: 2,
		created_at: new Date().toISOString(),
		actions: ["clear", "back"],
	},
	{
		_id: "2",
		alias: "Build 2",
		used_in: 3,
		participants: 8,
		experiments: 1,
		created_at: new Date().toISOString(),
		actions: ["continue"],
	},
	{
		_id: "3",
		alias: "Build 3",
		used_in: 4,
		participants: 12,
		experiments: 3,
		created_at: new Date().toISOString(),
		actions: ["clear", "continue"],
	},
];
