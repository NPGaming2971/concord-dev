import { BaseFetchOptions, CachedManager, ChannelResolvable, Client, NewsChannel, TextChannel } from 'discord.js';
import { ChannelRegistry } from '../structures/';
import type { APIChannelRegistry, AtLeastOne, RegisterableChannel, RegistryCreateOptions } from '../typings';
import { DatabaseStatementBuilder, Separators } from '../utils';

// Reduce database workload. Block unregistered channel.
const Blocker = new Set<string>();

export type ChannelRegistryResolvable = string | RegisterableChannel | ChannelRegistry;

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

		const { getRegistry } = this.client.database.statements;

		const data: APIChannelRegistry | undefined = getRegistry.get(id);

		if (!data) {
			Blocker.add(id);
			return null;
		}

		return this._add(data, cache, { id: id, extras: [] });
	}

	public query(options: AtLeastOne<APIChannelRegistry>) {
		const query = `SELECT * FROM channels WHERE ${DatabaseStatementBuilder.transformObject(options, Separators.Equal, Separators.And)}`;

		return this.client.database.database
			.prepare(query)
			.all()
			.map((i) => this._add(i, true, { id: i.id, extras: [] }));
	}

	public delete(channel: ChannelResolvable) {
		const id = this.client.channels.resolveId(channel);
		const { deleteRegistry } = this.client.database.statements;

		const registry = this.cache.get(id);

		this.client.database.database.transaction(() => {
			registry?.group?.channels.kick(id);
			deleteRegistry.run(id);
		})();

		this.cache.delete(id);

		Blocker.add(id);
		return;
	}

	public create(options: RegistryCreateOptions) {
		const { channel, url, groupId } = options;
		const { id, guildId } = this.client.channels.resolve(channel) as RegisterableChannel;

		const { createRegistry } = this.client.database.statements;

		const data = {
			id,
			guildId,
			webhookurl: url,
			groupId
		};

		createRegistry.run(data);

		Blocker.delete(id);
		return this._add(data, true, { id: id, extras: [] });
	}
	public has(channel: ChannelResolvable) {
		const bool = this.fetch(channel) !== null;
		Blocker[bool ? 'delete' : 'add'](this.client.channels.resolveId(channel));
		return bool;
	}

	public override resolveId(resolvable: string | ChannelRegistry<boolean>): string;
	public override resolveId(resolvable: ChannelRegistryResolvable): string | null;
	public override resolveId(registry: any): string | null {
		if (registry instanceof this.holds) {
			return registry.channelId;
		}

		if (registry instanceof TextChannel || registry instanceof NewsChannel) {
			return super.resolveId(registry);
		}

		return super.resolveId(registry);
	}
}
