import { Enumerable } from "@sapphire/decorators";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { Logger } from "./Logger";

export class ConcordClient extends Client {
    @Enumerable(false)
    public override logger = Logger

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
        logger: Logger;
        
    }
}