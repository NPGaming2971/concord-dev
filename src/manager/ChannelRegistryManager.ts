import { BaseFetchOptions, CachedManager, ChannelResolvable, Client } from "discord.js";
import { ChannelRegistry } from "../structures/";
import type { APIChannelRegistry, RegisterableChannel, RegistryCreateOptions } from "../typings";

export class ChannelRegistryManager extends CachedManager<
	string,
	ChannelRegistry,
	ChannelRegistry
> {


	constructor(client: Client) { 
		super(client, ChannelRegistry);
	}

	fetch(channel: ChannelResolvable, { cache = true, force = false }: BaseFetchOptions = {}) {
		const id = this.client.channels.resolveId(channel);

		if (!force) {
			const existing = this.cache.get(id);
			if (existing) return existing;
		}

		const { getRegistry } = this.client.statements;

		const data: APIChannelRegistry | undefined = getRegistry.get(id);
	
		if (!data) return null

		const group = data.groupId ? this.client.groups.cache.get(data.groupId) : null;
		return this._add(data, cache, { id: id, extras: [group] });
	}

	delete(channel: ChannelResolvable) { 
		const id = this.client.channels.resolveId(channel);
		const { deleteRegistry } = this.client.statements;

		deleteRegistry.run(id);
		this.cache.delete(id);
	}

	create(options: RegistryCreateOptions) {
		const { channel, url, groupId } = options;
		const { id, guildId } = this.client.channels.resolve(channel) as RegisterableChannel;

		const { createRegistry } = this.client.statements;

		const data = {
			id: id,
			guildId: guildId,
			webhookurl: url,
			groupId: groupId,
		};

		createRegistry.run(data);

		if (this.cache.has(id)) {
			return this.cache.get(id)!._patch(data);
		} else {
			return this._add(data, true, { id: id, extras: [] });
		}
	}
	has(channel: ChannelResolvable) {
		return this.fetch(channel) !== null;
	}
}
