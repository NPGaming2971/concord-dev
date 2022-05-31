import type { Database } from 'better-sqlite3';
import { Base, Client, Formatters, LocaleString, Message, WebhookMessageOptions } from 'discord.js';
import { GroupMessageManager, GroupMessageSendOptions } from '../../manager/GroupMessageManager';
import { GroupRegistryManager } from '../../manager/GroupRegistryManager';
import type { APIGroup } from '../../typings';
import type { GroupStatusType } from '../../typings/enums';
import { DatabaseUtil } from '../../utils/DatabaseUtil';
import { Util } from '../../utils';
const { fallback } = Util;
import { cloneDeep } from 'lodash';

export class Group extends Base implements Group {
	constructor(client: Client, data: APIGroup, database: Database) {
		super(client);

		this.channels = new GroupRegistryManager(this);
		this.messages = new GroupMessageManager(this);
		this.database = database;
		this.raw = data;
		this._patch(data);
	}

	private firstRun = false;

	public displayAvatarURL() {
		return this.avatar ?? this.client.rest.cdn.defaultAvatar(0);
	}

	public displayDescription() {
		return this.description ?? 'No description provided.';
	}

	public displayBannerURL() {
		return this.banner;
	}

	public displayName() {
		return this.name ?? 'Unnamed';
	}

	public displayLocale() {
		try {
			return new Intl.DisplayNames('en', { type: 'region', fallback: 'none' }).of(this.locale!.toUpperCase());
		} catch {
			return 'global';
		}
	}

	public async fetchOwner() {
		return this.client.users.fetch(this.ownerId);
	}
	public async send(message: Message | WebhookMessageOptions, options: GroupMessageSendOptions = { exclude: [] }) {
		return this.messages.create(message, options);
	}

	private _patch(data: Partial<APIGroup>) {
		if (data.tag) {
			this.tag = data.tag;
		}

		if (data.id) {
			this.id = data.id;
		}

		if (data.createdTimestamp) {
			this.createdTimestamp = data.createdTimestamp;
		}

		if (data.data?.channelLimit) {
			this.channelLimit = data.data.channelLimit;
		}

		if (data.ownerId) {
			this.ownerId = data.ownerId;
		}

		this.locale = data.locale as LocaleString | null;
		if (data.status) {
			this.status = data.status;
		}

		if (data.settings) {
			this.settings = data.settings
		}

		if (!this.firstRun) {
			this.firstRun = false;

			this.channels.cache.clear();
			const registries = this.client.statements.fetchRegistriesOfGroup.all(this.id);
			for (const registry of registries) {
				this.channels._add(registry, true, { id: registry.id, extras: [] });
			}
		}

		if (data.appearances) {
			this.avatar = data.appearances.avatar;

			if ('banner' in data.appearances) this.banner = data.appearances.banner ?? null;

			this.name = data.appearances.name;

			if ('description' in data.appearances) this.description = data.appearances.description;
		}
	}
	public get createdAt() {
		return new Date(this.createdTimestamp);
	}

	public override toJSON(): APIGroup {
		return this.raw;
	}

	public override toString() {
		return Formatters.inlineCode(`@` + this.tag);
	}

	public edit(data: Partial<APIGroup>) {
		const apiGroup = Util.flatten(this.toJSON());
		const updateData = Util.flatten(data);

		for (const [key, value] of Object.entries(updateData)) {
			const preData = apiGroup[key];
			apiGroup[key] = fallback(value, preData);
		}

		//TODO
		const preGroup = cloneDeep(this);
		const groupData = Util.unflatten(Object.assign(apiGroup, { settings: { maxCharacterLimit: 1024 } })) as APIGroup;

		this.client.statements.groupUpdate.run(DatabaseUtil.makeDatabaseCompatible(groupData));
		this._patch(groupData);

		this.client.emit('groupUpdate', preGroup, this);
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
	raw: APIGroup;
	ownerId: string;
	locale: LocaleString | null;
	channels: GroupRegistryManager;
	messages: GroupMessageManager;
	status: GroupStatusType;
	database: Database;
	settings: APIGroup['settings']
}
