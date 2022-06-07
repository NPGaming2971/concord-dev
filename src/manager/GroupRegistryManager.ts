import { CachedManager, ChannelResolvable } from "discord.js";
import { ChannelRegistry, Error, type Group } from "../structures/";
import { Events } from "../typings/enums";

export interface GroupRegistryManager {
	group: Group;
}

export class GroupRegistryManager extends CachedManager<string, ChannelRegistry, any> {
	constructor(group: Group) {
		super(group.client, ChannelRegistry);

		this.group = group;
	}

	public add(channel: ChannelResolvable) {
		const id = this.client.channels.resolveId(channel);

		if (this.group.channelLimit === this.group.channels.cache.size) throw new Error('GROUP_CHANNEL_LIMIT', this.group.toString(), this.group.channelLimit)

		const registry = this.client.registry.fetch(id);
		if (!registry) throw new Error('NON_EXISTENT_RESOURCE', ChannelRegistry.name, id);
		if (registry.groupId) throw new Error('DUPLICATED_RESOURCE', 'Property', 'groupId', `${ChannelRegistry.name} '${id}'`)

		console.log(this.group.id)
		registry.edit({ groupId: this.group.id });

		this.client.emit(Events.GroupMemberAdd, registry);
		this.cache.set(registry.channelId, registry);
		this.group.requests.bulkDelete(i => i.channelId === registry.channelId)

		return registry
	}
	
	public kick(channel: ChannelResolvable) {
		const id = this.client.channels.resolveId(channel);

		const registry = this.client.registry.fetch(id);
		if (!registry) throw new Error('NON_EXISTENT_RESOURCE', ChannelRegistry.name, id);
		if (!registry.groupId) throw new Error('NON_EXISTENT_RESOURCE', 'Property', 'groupId', `${ChannelRegistry.name} '${id}'`);

		registry.edit({ groupId: null });

		this.client.emit(Events.GroupMemberRemove, registry)
		this.cache.delete(registry.channelId);
		return registry
	}



	public ban() {}
}
