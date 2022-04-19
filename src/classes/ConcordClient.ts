import { Client, GatewayIntentBits, Partials } from "discord.js";
import { CommandManager } from "../manager/CommandManager";
import { Enumerable } from "../utils/decorators";
import { Logger } from "./Logger";

export class ConcordClient extends Client<true> {
    @Enumerable(false)
    public override logger = Logger

    @Enumerable(false)
    public override commands = new CommandManager(this) as CommandManager

	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.GuildMessageTyping,
				GatewayIntentBits.MessageContent,
			],
			partials: [Partials.User, Partials.GuildMember, Partials.Message],
		});
	}
}

declare module 'discord.js' {
    interface Client {
        logger: typeof Logger;
        commands: CommandManager
    }
}