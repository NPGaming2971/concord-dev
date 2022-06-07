import Database, { Statement } from 'better-sqlite3';

type PreparedStatement = { [key in keyof typeof DatabaseManager.Statements]: Statement };
export class DatabaseManager {
	public database: Database.Database;

	static Statements = {
		fetchRegistriesOfGroup: 'SELECT * FROM channels WHERE groupId = ?',
		groupCreate:
			'INSERT INTO groups (tag, id, ownerId, settings, appearances, entrance, data, locale, status, bans) values (@tag, @id, @ownerId, @settings, @appearances, @entrance, @data, @locale, @status, @bans)',
		groupUpdate:
			'REPLACE INTO groups (tag, id, ownerId, settings, appearances, entrance, data, locale, status, bans) values (@tag, @id, @ownerId, @settings, @appearances, @entrance, @data, @locale, @status, @bans)',
		fetchGroupById: 'SELECT * FROM groups WHERE id = ?',
		fetchGroupByTag: 'SELECT * FROM groups WHERE LOWER(tag) = ?',
		deleteGroup: 'DELETE FROM groups WHERE id = ?',
		fetchAllGroups: 'SELECT * FROM groups',
		fetchAllRegistries: 'SELECT * FROM channels',
		createRegistry: 'INSERT OR REPLACE INTO channels (id, webhookurl, guildId, groupId) VALUES (@id, @webhookurl, @guildId, @groupId);',
		deleteRegistry: 'DELETE FROM channels WHERE id = ?',
		getRegistry: 'SELECT * FROM channels WHERE id = ?;',
	};

	constructor(path: string, options: Database.Options = {}) {
		this.database = this.establish(path, options);
		this.initiate();

		this.statements = this.prepareStatements();
	}

	private prepareStatements(): PreparedStatement {
		//@ts-expect-error
		const preparedStatements: PreparedStatement = {};

		for (const [name, statement] of Object.entries(DatabaseManager.Statements)) {
			Object.assign(preparedStatements, {
				[`${name}`]: this.database.prepare(statement)
			});
		}
		return preparedStatements;
	}

	public establish(path: string, options: Database.Options): Database.Database {
		return new Database(path, options);
	}

	public initiate() {
		const pragmaRules = ['synchronous = 1', 'journal_mode = wal', 'cache_size = 32000', 'auto_vacuum = FULL', 'foreign_keys = ON'];

		const Routes = {
			createTable: {
				groups: 'CREATE TABLE IF NOT EXISTS groups (tag TEXT PRIMARY KEY NOT NULL UNIQUE, id TEXT NOT NULL UNIQUE, ownerId TEXT NOT NULL, entrance TEXT, data TEXT NOT NULL, appearances TEXT NOT NULL, settings TEXT NOT NULL, locale TEXT NOT NULL, status TEXT NOT NULL, bans TEXT NOT NULL);',
				channels:
					'CREATE TABLE IF NOT EXISTS channels (id TEXT PRIMARY KEY NOT NULL UNIQUE, webhookurl TEXT NOT NULL UNIQUE, guildId TEXT NOT NULL, groupId TEXT, FOREIGN KEY (groupId) REFERENCES groups(id) ON UPDATE CASCADE ON DELETE NO ACTION);'
			},
			createIndex: {
				groupId: 'CREATE UNIQUE INDEX IF NOT EXISTS idx_group_id ON groups (id);',
				channelId: 'CREATE UNIQUE INDEX IF NOT EXISTS idx_channels_id ON channels (id);'
			}
		};

		Object.values({ ...Routes.createTable, ...Routes.createIndex }).forEach((query) => {
			this.database.exec(query);
		});

		pragmaRules.forEach((rule) => this.database.pragma(rule));
	}

	public parseData(data: object) {
		if (typeof data !== 'object') throw new TypeError('Invalid parameter type.');
		const objIterable = Object.entries(data);
		//Check if given parameter is iterable.
		if (typeof objIterable[Symbol.iterator] !== 'function') throw new Error('Parameter is uniterable.');

		const resolved: any = {};
		for (const [key, val] of objIterable) {
			Object.assign(resolved, {
				[`${key}`]: this.tryParseJSONObject(val)
			});
		}

		return resolved;
	}

	public makeCompatible(data: object) {
		const objIterable = Object.entries(data);

		const resolved: any = {};
		for (const [key, val] of objIterable) {
			Object.assign(resolved, {
				[`${key}`]: typeof val !== 'string' ? JSON.stringify(val) : val
			});
		}
		return resolved;
	}

	private tryParseJSONObject(jsonString: string) {
		try {
			var o = JSON.parse(jsonString);

			if (o && typeof o === 'object') {
				return o;
			}
		} catch (e) {}

		return jsonString;
	}
}

export interface DatabaseManager {
	database: Database.Database;
	statements: PreparedStatement;
}
