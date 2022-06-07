import type { Database } from 'better-sqlite3';
import { BaseFetchOptions, CachedManager, Client, SnowflakeUtil } from 'discord.js';
import { Group, ChannelRegistry, Error } from '../structures';
import type { APIGroup, GroupCreateOptions, GroupResolvable, GroupSettings } from '../typings';
import { Events, GroupStatusType } from '../typings/enums';

export class GroupManager extends CachedManager<string, Group, GroupResolvable> {
	private database: Database;

	constructor(client: Client, database: Database) {
		super(client, Group);

		this.database = database;
		this.#_populateCache();
	}

	public fetch(id: string, { cache = true, force = false }: BaseFetchOptions = {}) {
		if (!force) {
			const existing = this.cache.get(id);
			if (existing) return existing;
		}

		const { fetchGroupById } = this.client.database.statements;

		const data: APIGroup | undefined = fetchGroupById.get(id);
		if (!data) return null;
		return this._add(data, cache, { id: id, extras: [] });
	}

	//TODO: Validate locale
	public create(tag: string, options: GroupCreateOptions) {
		const { avatar = null, banner = null, owner, name = null, description = null, locale = 'global' } = options
		const ownerId = this.client.users.resolveId(owner);
		if (this.cache.find((i) => i.tag === tag))
			throw new Error('DUPLICATED_RESOURCE', this.holds.name, tag);

		const data = {
			tag,
			appearances: {
				banner,
				avatar,
				description,
				name
			},
			data: {
				users: [],
				channelLimit: 15
			},
			ownerId,
			entrance: {
				password: null,
				requests: []
			},
			locale,
			id: SnowflakeUtil.generate({ timestamp: Date.now() }).toString(),
			status: GroupStatusType.Public,
			bans: [],
			settings: this.defaultGroupSettings
		};

		console.log(this.client.database.makeCompatible(data))
		this.client.database.statements.groupCreate.run(this.client.database.makeCompatible(data));

		this.client.emit(Events.GroupCreate, this._add(data, true, { id: data.id, extras: [this.database] }));
		return this.cache.get(data.id)!;
	}

	private get defaultGroupSettings(): GroupSettings {
		return {
			maxCharacterLimit: 1900,
			requests: {
				deleteDuplicate: true
			}
		};
	}

	public override resolve(group: GroupResolvable): Group {
		if (group instanceof ChannelRegistry && group.groupId) {
			return super.resolve(group.group!);
		}
		return super.resolve(group) as Group;
	}

	public override resolveId(group: GroupResolvable): string {
		if (group instanceof ChannelRegistry && group.groupId) {
			return super.resolveId(group.group!.id);
		}
		return super.resolveId(group) as string;
	}

	public delete(group: GroupResolvable) {
		const target = this.resolve(group);

		const { deleteGroup } = this.client.database.statements;

		this.database.transaction(() => target.channels.cache.map((i) => i.edit({ groupId: null })))();
		deleteGroup.run(target.id);

		this.client.emit(Events.GroupDelete, target);
		this.cache.delete(target.id);
	}

	#_populateCache() {
		this.client.database.statements.fetchAllGroups.all().map((e) => {
			const parsed = this.client.database.parseData(e);
			this._add(parsed, true, { id: e.id, extras: [this.database] });
		});
	}
}
