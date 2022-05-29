//@ts-nocheck
import { BaseGuildTextChannel, Channel, ChannelType } from 'discord.js';
import type { ChannelRegistry } from '../structures';
import type { RegisterableChannel } from '../typings';
import { ApplyToClass } from './decorators';

export class Extensions {

	@ApplyToClass(BaseGuildTextChannel)
	static fetchRegistry() {
		return this.client.registry.fetch(this.id);
	}

    @ApplyToClass(Channel)
    static isRegisterable() {
        return [ChannelType.GuildText, ChannelType.GuildNews].includes(this.type)
    }
}

declare module 'discord.js' {
	interface BaseGuildTextChannel {
		fetchRegistry(): ChannelRegistry | null;
	}
    interface Channel {
        isRegisterable(): this is RegisterableChannel
    }
}
