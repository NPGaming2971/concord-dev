import type { Client } from "discord.js";

export class DatabaseUtil {
	static parseRawData(rawData: any): any {

		if (typeof rawData !== "object") throw new TypeError("Invalid parameter type.");
		const objIterable = Object.entries(rawData);
		//Check if given parameter is iterable.
		if (typeof objIterable[Symbol.iterator] !== "function")
			throw new Error("Parameter is uniterable.");
		const resolved: any = {};
		for (const [key, val] of objIterable) {
			Object.assign(resolved, {
				[`${key}`]:
					typeof val === "string" && val.startsWith("[") && val.endsWith("]")
						? JSON.parse(val)
						: typeof val == "string" && val.startsWith("{") && val.endsWith("}")
						? JSON.parse(val)
						: val,
			});
		}
		return resolved;
	}
	static makeDatabaseCompatible(data: object) {
		const objIterable = Object.entries(data);

		const resolved: any = {};
		for (const [key, val] of objIterable) {
			Object.assign(resolved, {
				[`${key}`]: typeof val !== "string" ? JSON.stringify(val) : val,
			});
		}
		return resolved;
	}
	static init(client: Client) {

		const pragmaRules = [
			"synchronous = 1",
			"journal_mode = wal",
			"cache_size = 32000",
			"auto_vacuum = FULL",
			"foreign_keys = ON",
		];

		const Routes = {
			createTable: {
				groups:
					"CREATE TABLE IF NOT EXISTS groups (tag TEXT PRIMARY KEY NOT NULL UNIQUE, id TEXT NOT NULL UNIQUE, ownerId TEXT NOT NULL, entrance TEXT, data TEXT NOT NULL, appearances TEXT NOT NULL, settings TEXT NOT NULL, locale TEXT NOT NULL, status TEXT NOT NULL, createdTimestamp INTERGER NOT NULL, bans TEXT NOT NULL);",
				channels:
					"CREATE TABLE IF NOT EXISTS channels (id TEXT PRIMARY KEY NOT NULL UNIQUE, webhookurl TEXT NOT NULL UNIQUE, guildId TEXT NOT NULL, groupId TEXT, FOREIGN KEY (groupId) REFERENCES groups(id) ON UPDATE CASCADE ON DELETE SET NULL);",
			},
			createIndex: {},
		};

		Object.values({ ...Routes.createIndex, ...Routes.createTable }).forEach((query) => {
			client.database.exec(query);
		});

		pragmaRules.forEach(rule => client.database.pragma(rule))
	}
}
