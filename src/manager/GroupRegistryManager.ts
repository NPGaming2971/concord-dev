import { CachedManager, ChannelResolvable } from "discord.js";
import { ChannelRegistry, type Group } from "../structures/";

export interface GroupRegistryManager {
	group: Group;
}

export class GroupRegistryManager extends CachedManager<string, ChannelRegistry, any> {
	constructor(group: Group, iterable?: Iterable<any>) {
		//@ts-expect-error
		super(group.client, ChannelRegistry, iterable);

		this.group = group;
	}

	public add(channel: ChannelResolvable) {
		const id = this.client.channels.resolveId(channel);

		let registry = this.client.registry.fetch(id);
		if (!registry) throw new Error("Channel is not present in database.");

		registry = registry.edit({ groupId: this.group.id });

		this.cache.set(registry.channelId, registry);
		return registry
	}
	
	public kick(channel: ChannelResolvable) {
		const id = this.client.channels.resolveId(channel);

		let registry = this.client.registry.fetch(id);
		if (!registry) throw new Error("Channel is not present in database.");

		registry = registry.edit({ groupId: null });

		this.cache.delete(registry.channelId);
		return registry
	}
	public ban() {}
}
