import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { CommandManager } from '../manager/CommandManager';
import { Enumerable } from '../utils/decorators';
import { Logger } from './Logger';
import { GroupManager } from '../manager/GroupManager';
import SQLite from 'better-sqlite3';

import type { Command, Group } from '../structures/';
import type BetterSqlite3 from 'better-sqlite3';
import { ChannelRegistryManager } from '../manager/ChannelRegistryManager';
import '../utils/extensions';
import { DatabaseStatement, PreparedStatement } from '../utils/Statements';

export class ConcordClient extends Client<true> {
	@Enumerable(false)
	public override logger = Logger;

	@Enumerable(false)
	public override database: BetterSqlite3.Database = new SQLite('./database/groups.sqlite');

	@Enumerable(false)
	public override statements: PreparedStatement = DatabaseStatement.prepareStatements(this.database);

	// Managers
	@Enumerable(false)
	public override commands = new CommandManager(this) as CommandManager;

	@Enumerable(false)
	public override groups: GroupManager = new GroupManager(this, this.database);

	@Enumerable(false)
	public override registry: ChannelRegistryManager = new ChannelRegistryManager(this);

	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.GuildMessageTyping,
				GatewayIntentBits.MessageContent
			],
			partials: [Partials.User, Partials.GuildMember, Partials.Message]
		});
	}
}

declare module 'discord.js' {
	interface Client<Ready extends boolean = boolean> {
		logger: typeof Logger;
		commands: CommandManager;
		database: BetterSqlite3.Database;
		groups: GroupManager;
		registry: ChannelRegistryManager;
		statements: PreparedStatement;
	}
	interface Caches {
		CommandManager: [manager: typeof CommandManager, holds: typeof Command];
		GroupManager: [manager: typeof GroupManager, holds: typeof Group];
	}
	interface ClientEvents {
		groupCreate: [group: Group];
		groupUpdate: [oldGroup: Group, newGroup: Group];
	}
}
