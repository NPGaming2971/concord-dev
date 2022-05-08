import type { Database } from "better-sqlite3";
import { Base, Client, LocaleString } from "discord.js";
import { GroupRegistryManager } from "../../manager/GroupRegistryManager";
import type { APIGroup } from "../../typings";
import type { GroupStatusType } from "../../typings/enums";

export class Group extends Base implements Group {
	constructor(client: Client, data: APIGroup, database: Database) {
		super(client);

		this.channels = new GroupRegistryManager(this);
		this.database = database;
		this._patch(data);
	}

	public getAvatarURL() {
		return this.avatar ?? this.client.rest.cdn.defaultAvatar(0);
	}

	public getDescription() {
		return this.description ?? "No description provided.";
	}

	public getBannerURL() {
		return this.banner;
	}

	public getName() {
		return this.name ?? "Unnamed";
	}

	public getLocale() {
		if (this.locale) {
			try {
				return new Intl.DisplayNames("en", { type: "region", fallback: "none" }).of(
					this.locale.toUpperCase()
				);
			} catch {
				return "global";
			}
		} else return "global";
	}

	public async fetchOwner() {
		return this.client.users.fetch(this.ownerId);
	}

	private _patch(data: APIGroup) {
		this.tag = data.tag;

		this.id = data.id;

		this.createdAt = new Date(data.createdTimestamp!);

		this.channelLimit = data.data.channelLimit;

		this.createdTimestamp = data.createdTimestamp!;

		this.ownerId = data.ownerId;

		this.locale = data.locale as LocaleString | null;

		/**
		 * This group status type.
		 */
		this.status = data.status;

		/**
		 * This group members cache
		 */
		this.channels.cache.clear();
		const registries = this.client.statements.fetchRegistriesOfGroup.all(this.id);
		for (const registry of registries) {
			this.channels._add(registry, true, { id: registry.id, extras: [this] });
		}

		if ("appearances" in data) {
			this.avatar = data.appearances.avatar;

			if ("banner" in data.appearances) this.banner = data.appearances.banner ?? null;

			this.name = data.appearances.name;

			if ("description" in data.appearances) this.description = data.appearances.description;
		}
	}
}

export interface Group {
	id: string;
	tag: string;
	avatar: string | null;
	banner: string | null;
	name: string | null;
	description: string | null;
	createdTimestamp: number;
	createdAt: Date;
	channelLimit: number;
	ownerId: string;
	locale: LocaleString | null;
	channels: GroupRegistryManager;
	status: GroupStatusType;
	database: Database;
}
