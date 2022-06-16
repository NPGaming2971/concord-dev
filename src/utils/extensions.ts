import { BaseGuildTextChannel, Channel, VoiceChannel } from 'discord.js';
import type { ChannelRegistry, Group } from '../structures';
import type { RegisterableChannel } from '../typings';
import { ApplyToClass } from './decorators';

/*
EXTENDING GUIDES

This class is purely made to extend other classes.

- All function here must use the @ApplyToClass decorator.
- The first parameter will always be the prototype of the target class, or the class itself if `makeStatic: true`.
Additional parameter must be specified from the 2nd param onward.
- `this` is bound to this class.
- Methods that use other extended methods must be specified below the used method.
- Specify `isGetter: true` on ApplyToClass options to make the extended function a getter.

*/

export class Extensions {
	//@ts-expect-error
	@ApplyToClass([BaseGuildTextChannel, VoiceChannel])
	static fetchRegistry(channel: BaseGuildTextChannel) {
		return channel.client.registry.fetch(channel.id);
	}

	//@ts-expect-error
	@ApplyToClass([BaseGuildTextChannel], { isGetter: true })
	static group(channel: BaseGuildTextChannel | VoiceChannel) {
		const registry = channel.fetchRegistry();
		return registry?.group;
	}

	@ApplyToClass([Channel])
	static isRegisterable(channel: Channel) {
		return Reflect.has(channel, 'createWebhook');
	}
}

declare module 'discord.js' {
	interface BaseGuildTextChannel {
		fetchRegistry(): ChannelRegistry | null;
		get group(): Group | null;
	}
	interface VoiceChannel {
		fetchRegistry(): ChannelRegistry | null;
	}
	interface Channel {
		isRegisterable(): this is RegisterableChannel;
	}
}
