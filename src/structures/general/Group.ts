import type { Database } from 'better-sqlite3';
import { Base, Client, LocaleString, Message } from 'discord.js';
import { GroupMessageManager } from '../../manager/GroupMessageManager';
import { GroupRegistryManager } from '../../manager/GroupRegistryManager';
import type { APIGroup } from '../../typings';
import type { GroupStatusType } from '../../typings/enums';

export class Group extends Base implements Group {
	constructor(client: Client, data: APIGroup, database: Database) {
		super(client);

		this.channels = new GroupRegistryManager(this);
		this.messages = new GroupMessageManager(this);
		this.database = database;
		this.raw = data
		this._patch(data);
	}

	public getAvatarURL() {
		return this.avatar ?? this.client.rest.cdn.defaultAvatar(0);
	}

	public getDescription() {
		return this.description ?? 'No description provided.';
	}

	public getBannerURL() {
		return this.banner;
	}

	public getName() {
		return this.name ?? 'Unnamed';
	}

	public getLocale() {
		try {
			return new Intl.DisplayNames('en', { type: 'region', fallback: 'none' }).of(this.locale!.toUpperCase());
		} catch {
			return 'global';
		}
	}

	public async fetchOwner() {
		return this.client.users.fetch(this.ownerId);
	}
	public async send(message: Message) {
		return this.messages.create(message);
	}

	private _patch(data: APIGroup) {
		this.tag = data.tag;

		this.id = data.id;

		this.createdAt = new Date(data.createdTimestamp!);

		this.channelLimit = data.data.channelLimit;

		this.createdTimestamp = data.createdTimestamp!;

		this.ownerId = data.ownerId;

		this.locale = data.locale as LocaleString | null;

		this.status = data.status;

		this.channels.cache.clear();
		const registries = this.client.statements.fetchRegistriesOfGroup.all(this.id);
		for (const registry of registries) {
			this.channels._add(registry, true, { id: registry.id, extras: [this] });
		}

		if ('appearances' in data) {
			this.avatar = data.appearances.avatar;

			if ('banner' in data.appearances) this.banner = data.appearances.banner ?? null;

			this.name = data.appearances.name;

			if ('description' in data.appearances) this.description = data.appearances.description;
		}
	}

	public override toJSON(): APIGroup {
		return this.raw
	}
}

export interface Group {
	/**The id of this group. */
	id: string;
	tag: string;
	avatar: string | null;
	banner: string | null;
	name: string | null;
	description: string | null;
	createdTimestamp: number;
	createdAt: Date;
	channelLimit: number;
	raw: APIGroup
	ownerId: string;
	locale: LocaleString | null;
	channels: GroupRegistryManager;
	messages: GroupMessageManager;
	status: GroupStatusType;
	database: Database;
}
