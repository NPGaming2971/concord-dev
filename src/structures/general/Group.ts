import type { Database } from 'better-sqlite3';
import { Base, Client, Formatters, LocaleString, SnowflakeUtil } from 'discord.js';
import { GroupMessageManager, GroupMessageOptions } from '../../manager/GroupMessageManager';
import { GroupRegistryManager } from '../../manager/GroupRegistryManager';
import { GroupRequestManager } from '../../manager/GroupRequestManager';
import type { APIGroup, DeepPartial } from '../../typings';
import { Events, GroupStatusType } from '../../typings/enums';
import { Util } from '../../utils/Util';
import { cloneDeep, isUndefined } from 'lodash';
import Settings from '../../../assets/settings';

type SettingValue = string | number | boolean | null;
export class Group extends Base implements Group {
	constructor(client: Client, data: APIGroup, database: Database) {
		super(client);

		this.channels = new GroupRegistryManager(this);

		this.requests = new GroupRequestManager(this);

		this.messages = new GroupMessageManager(this);

		this.database = database;
		this.data = data;

		this._patch(data);
	}

	#firstRun = false;

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
	public async send(options: GroupMessageOptions) {
		return this.messages.create(options);
	}

	private _patch(data: Partial<APIGroup>) {
		
		if (data.tag) {
			this.tag = data.tag;
		}

		if (data.id) {
			this.id = data.id;
		}

		if (data.data) {
			if (data.data.channelLimit) this.channelLimit = data.data.channelLimit;
		}

		if (data.ownerId) {
			this.ownerId = data.ownerId;
		}

		if (data.entrance) {
			const { password, requests } = data.entrance;

			if (password) {
				this.password = password;
			}

			if (requests) {
				this.requests.cache.clear();
				for (const request of requests) {
					this.requests._add(request, true, { id: request.id, extras: [this.id] });
				}
			}
		}

		if (data.locale) this.locale = data.locale;
		if (data.status) {
			this.status = data.status;
		}

		if (data.settings) {
			this.settings = data.settings;
		}

		if (!this.#firstRun) {
			this.#firstRun = false;

			this.channels.cache.clear();
			const registries = this.client.database.statements.fetchRegistriesOfGroup.all(this.id);
			for (const registry of registries) {
				this.client.registry._add(registry, true, { id: registry.id, extras: [] });
				this.channels._add(registry, true, { id: registry.id, extras: [] });
			}
		}

		if (data.appearances) {
			if ('avatar' in data.appearances) this.avatar = data.appearances.avatar;

			if ('banner' in data.appearances) this.banner = data.appearances.banner ?? null;

			if ('name' in data.appearances) this.name = data.appearances.name;

			if ('description' in data.appearances) this.description = data.appearances.description;
		}
	}

	public get createdTimestamp() {
		return Number(SnowflakeUtil.decode(this.id).timestamp.toString());
	}

	public get createdAt() {
		return new Date(this.createdTimestamp);
	}

	public override toJSON(): APIGroup {
		return { ...this.data };
	}

	public getSetting(path: string, defaultValue?: SettingValue) {
		const settingValue = Util.getProperty(this.settings, path);

		if (isUndefined(defaultValue)) {
			defaultValue = Settings.find((i) => i.path === `settings.${path}`)?.default ?? null;
		}

		if (!settingValue) {
			this.edit({ settings: { [`${path}`]: defaultValue } });
		}

		return settingValue;
	}

	public override toString() {
		return Formatters.inlineCode(`@` + this.tag);
	}

	public edit(data: DeepPartial<APIGroup>) {
		const apiGroup = Util.flatten(this.toJSON());
		const updateData = Util.flatten(data);

		if (!Object.values(updateData).length) return;

		for (const [key, value] of Object.entries(updateData)) {
			const preData = apiGroup[key];
			apiGroup[key] = Util.fallback(value, preData);
		}

		//TODO
		const preGroup = cloneDeep(this);
		const groupData = Util.unflatten(apiGroup) as APIGroup;

		this.client.database.statements.groupUpdate.run(this.client.database.makeCompatible(groupData));
		this._patch(groupData);

		this.client.emit(Events.GroupUpdate, preGroup, this);
	}

	public delete() {
		return this.client.groups.delete(this);
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
	password: string | null;
	channelLimit: number;
	data: APIGroup;
	ownerId: string;
	locale: LocaleString | null;
	channels: GroupRegistryManager;
	requests: GroupRequestManager;
	messages: GroupMessageManager;
	status: GroupStatusType;
	database: Database;
	settings: APIGroup['settings'];
}
