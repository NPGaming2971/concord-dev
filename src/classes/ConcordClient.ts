import { Client, GatewayIntentBits, Options, Partials } from 'discord.js';
import { CommandManager } from '../manager/CommandManager';
import { Enumerable } from '../utils/decorators';
import { Logger } from './Logger';
import { GroupManager } from '../manager/GroupManager';

import type { ChannelRegistry, Command, Group } from '../structures/';
import { ChannelRegistryManager } from '../manager/ChannelRegistryManager';
import '../utils/Extensions';
import type { GroupRegistryManager } from '../manager/GroupRegistryManager';
import type { GroupMessageManager } from '../manager/GroupMessageManager';
import type { GroupMessage } from '../structures/general/GroupMessage';
import { DatabaseManager } from '../manager/DatabaseManager';

export class ConcordClient extends Client<true> {
	@Enumerable(false)
	public override logger = Logger;

	@Enumerable(false)
	public override database: DatabaseManager = new DatabaseManager('./database/groups.sqlite');

	// Managers
	@Enumerable(false)
	public override commands = new CommandManager(this) as CommandManager;

	@Enumerable(false)
	public override registry: ChannelRegistryManager = new ChannelRegistryManager(this);

	@Enumerable(false)
	public override groups: GroupManager = new GroupManager(this, this.database.database);

	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildMessageReactions
			],
			partials: [Partials.User, Partials.GuildMember, Partials.Message],
			makeCache: Options.cacheWithLimits({
				...Options.DefaultMakeCacheSettings,
				PresenceManager: 0,
				ThreadManager: 0,
				ThreadMemberManager: 0,
				GuildEmojiManager: 0,
				GuildScheduledEventManager: 0
			})
		});
		this.commands.load({
			path: {
				commands: `${process.cwd()}/src/commands/`,
				events: `${process.cwd()}/src/listener/`
			},
			options: {
				errorOnNoMatches: true,
				subfolderDepth: 1,
				deploy: true,
				extensions: ['ts']
			}
		});
	}
}

declare module 'discord.js' {
	interface Client<Ready extends boolean = boolean> {
		logger: typeof Logger;
		commands: CommandManager;
		database: DatabaseManager;
		groups: GroupManager;
		registry: ChannelRegistryManager;
	}
	interface Caches {
		CommandManager: [manager: typeof CommandManager, holds: typeof Command];
		GroupManager: [manager: typeof GroupManager, holds: typeof Group];
		ChannelRegistryManager: [manager: ChannelRegistryManager, holds: typeof ChannelRegistry];
		GroupRegistryManager: [manager: GroupRegistryManager, holds: typeof ChannelRegistry];
		GroupMessageManager: [manager: GroupMessageManager, holds: typeof GroupMessage];
	}
	interface ClientEvents {
		groupCreate: [group: Group];
		groupUpdate: [oldGroup: Group, newGroup: Group];
		groupDelete: [group: Group];
		groupMemberAdd: [registry: ChannelRegistry];
		groupMemberRemove: [registry: ChannelRegistry];
	}
}
