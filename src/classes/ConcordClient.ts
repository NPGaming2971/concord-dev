import { Client, ClientOptions } from 'discord.js';
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
import type { CommandLoadOptions } from '../typings';
//import { GlobalBanManager } from '../manager/GlobalBanManagerer';

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
	public override groups: GroupManager = new GroupManager(this);


//	@Enumerable(false)
//	public override bans: GlobalBanManager = new GlobalBanManager(this)

	constructor(options: ClientOptions & { commands: CommandLoadOptions }) {
		super(options);
		this.commands.load(options.commands);
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
		ChannelRegistryManager: [manager: typeof ChannelRegistryManager, holds: typeof ChannelRegistry];
		GroupRegistryManager: [manager: typeof GroupRegistryManager, holds: typeof ChannelRegistry];
		GroupMessageManager: [manager: typeof GroupMessageManager, holds: typeof GroupMessage];
	}
	interface ClientEvents {
		groupCreate: [group: Group];
		groupUpdate: [oldGroup: Group, newGroup: Group];
		groupDelete: [group: Group];
		groupMemberAdd: [registry: ChannelRegistry];
		groupMemberRemove: [registry: ChannelRegistry];
	}
}
