import { Formatters } from "discord.js";

type ConcordErrorConstructor = {
	message: string;
    name: string
	type?: ConcordErrorType;
};

export enum ConcordErrorType {
	INFORMATIONAL = 0,
	SUCCESS = 1,
	WARNING = 2,
	ERROR = 3,
	FATAL = 4,
}

export class ConcordError extends Error {
	public type: ConcordErrorType;

	constructor(options: ConcordErrorConstructor) {
		super(options.message);
		this.name = options.name;
		this.type = options.type ?? ConcordErrorType.ERROR;
	}
	override toString() {
		const emojisMap: { [key: number]: string } = {
			0: "ℹ",
			1: "✔",
			2: `⚠`,
			3: `❌`,
			4: `🟥`
		};
		return `\`${emojisMap[this.type]}\` ${Formatters.bold(this.name)}\n${this.message}`;
	}
}
