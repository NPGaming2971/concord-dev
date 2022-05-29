import type { ChannelResolvable, NewsChannel, TextChannel, UserResolvable } from "discord.js";
import type { APIMessage } from "discord.js/node_modules/discord-api-types/v10";
import type { ChannelRegistry, Group } from "../structures/";
import type { GroupPermissionsFlagBits, GroupStatusType } from "./enums";

export type CommandAndEventLoadOptions = {
	errorOnNoMatches?: boolean;
	errorOnEmptyFile?: boolean;
};

export type GroupPermissionsString = keyof typeof GroupPermissionsFlagBits

export type CommandLoadOptions = {
	path: Partial<{
		commands: string;
		events: string;
	}>;
	options?: {
		/**
		 * Accepted file extensions. Default to ['ts'].
		 */
		extensions?: string[];
		subfolderDepth?: number;
		deploy?: boolean;
		errorOnNoMatches?: boolean;
		errorOnEmptyFile?: boolean;
	};
};

export type NonNullObject = {} & object;

export interface APIGroupMessage {
	url: string;
	message: APIMessage;
	group: Group;
	parentId: [string, string] | [null, null]
	registry: ChannelRegistry
}

export interface GroupCreateOptions {
	name?: string | null;
	description?: string | null;
	owner: UserResolvable;
	avatar?: string | null;
	locale?: string | null;
	banner?: string | null;
}

export interface APIGroup {
	appearances: {
		banner: string | null;
		avatar: string | null;
		description: string | null;
		name: string | null;
	};
	entrance: {
		password: string | null;
		requests: any[];
	};
	status: GroupStatusType;
	ownerId: string;
	data: {
		users: string[];
		channelLimit: number;
	};
	locale: string | null;
	id: string;
	tag: string;
	bans: string[];
	settings: {};
	createdTimestamp: number;
}

export interface APIChannelRegistry {
	id: string;
	webhookurl: string | null;
	guildId: string;
	groupId: string | null;
}

export type GroupResolvable = string | ChannelRegistry | Group;

export type RegisterableChannel = TextChannel | NewsChannel;

export type RegistryCreateOptions = {
	channel: RegisterableChannel;
	url: string | null;
	groupId: string | null;
};
