import { BaseFetchOptions, CachedManager, ChannelResolvable, Client } from 'discord.js';
import { ChannelRegistry } from '../structures/';
import type { APIChannelRegistry, RegisterableChannel, RegistryCreateOptions } from '../typings';

// Reduce database workload. Block unregistered channel.
const Blocker = new Set<string>();

type ChannelRegistryResolvable = string | RegisterableChannel;

export class ChannelRegistryManager extends CachedManager<string, ChannelRegistry, ChannelRegistryResolvable> {
	constructor(client: Client) {
		super(client, ChannelRegistry);
	}

	public fetch(channel: ChannelResolvable, { cache = true, force = false }: BaseFetchOptions = {}) {
		const id = this.client.channels.resolveId(channel);

		if (Blocker.has(id)) return null;

		if (!force) {
			const existing = this.cache.get(id);
			if (existing) return existing;
		}

		const { getRegistry } = this.client.statements;

		const data: APIChannelRegistry | undefined = getRegistry.get(id);

		if (!data) {
			Blocker.add(id);
			return null;
		}

		//@ts-expect-error
		return this._add(data, cache, { id: id, extras: [] });
	}

	delete(channel: ChannelResolvable) {
		const id = this.client.channels.resolveId(channel);
		const { deleteRegistry } = this.client.statements;

		const registry = this.cache.get(id);
		registry?.group?.channels.kick(id);

		deleteRegistry.run(id);
		this.cache.delete(id);
		Blocker.add(id);
	}

	create(options: RegistryCreateOptions) {
		const { channel, url, groupId } = options;
		const { id, guildId } = this.client.channels.resolve(channel) as RegisterableChannel;

		const { createRegistry } = this.client.statements;

		const data = {
			id: id,
			guildId: guildId,
			webhookurl: url,
			groupId: groupId
		};

		createRegistry.run(data);

		Blocker.delete(id);
		if (this.cache.has(id)) {
			return this.cache.get(id)!._patch(data);
		} else {
			//@ts-expect-error
			return this._add(data, true, { id: id, extras: [] });
		}
	}
	has(channel: ChannelResolvable) {
		const bool = this.fetch(channel) !== null;
		Blocker[bool ? 'delete' : 'add'](this.client.channels.resolveId(channel));
		return bool;
	}
}