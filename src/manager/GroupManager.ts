import type { Database } from 'better-sqlite3';
import { CachedManager, Client, SnowflakeUtil } from 'discord.js';
import { Group, ChannelRegistry } from '../structures/';
import { ConcordError } from '../structures/';
import type { GroupCreateOptions, GroupResolvable } from '../typings';
import { GroupStatusType } from '../typings/enums';
import { DatabaseUtil } from '../utils/DatabaseUtil';

export class GroupManager extends CachedManager<string, Group, GroupResolvable> {
	private database: Database;

	constructor(client: Client, database: Database, iterable?: Iterable<GroupResolvable>) {
		//@ts-expect-error
		super(client, Group, iterable);

		this.database = database;
		this._populateCache();
	}

	//TODO: Validate locale
	public create(tag: string, { avatar = null, banner = null, owner, name = null, description = null, locale = null }: GroupCreateOptions) {
		const ownerId = this.client.users.resolveId(owner);

		if (!ownerId)
			throw new ConcordError('INVALID_OWNER');

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
			settings: {},
			createdTimestamp: Date.now()
		};

		this.client.statements.groupCreate.run(DatabaseUtil.makeDatabaseCompatible(data));

		this.client.emit('groupCreate', this._add(data, true, { id: data.id, extras: [this.database] }));
		return this.cache.get(data.id)!;
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
		const id = this.resolveId(group);

		const { deleteGroup } = this.client.statements;

		deleteGroup.run(id);
		this.cache.delete(id);
	}

	private _populateCache() {
		this.client.statements.fetchAllGroups.all().map((e) => {
			const parsed = DatabaseUtil.parseRawData(e);
			this._add(parsed, true, { id: e.id, extras: [this.database] });
		});
	}
}
