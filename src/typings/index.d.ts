import type { LocaleString, NewsChannel, TextChannel, User, UserResolvable } from 'discord.js';
import type { APIMessage } from 'discord.js';
import type { ChannelRegistry, Group } from '../structures/';
import type { GroupPermissionsFlagBits, GroupStatusType, RequestState, RequestType } from './enums';

export type Maybe<T> = T | null;
export type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;
export type CommandAndEventLoadOptions = {
	errorOnNoMatches?: boolean;
	errorOnEmptyFile?: boolean;
};

export type AtLeastOne<T, U = {[K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

export type GroupPermissionsString = keyof typeof GroupPermissionsFlagBits;

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
	parentId: [string, string] | [null, null];
	registry: ChannelRegistry;
}

export interface GroupCreateOptions {
	name?: Maybe<string>;
	description?: Maybe<string>;
	owner: UserResolvable;
	avatar?: Maybe<string>;
	locale?: Maybe<string>;
	banner?: Maybe<string>;
}

export interface APIGroupRequest {
	channelId: string;
	message: Maybe<string>;
	id: string;
	type: RequestType;
	state: RequestState;
}

export interface APIGroup {
	appearances: {
		banner: Maybe<string>;
		avatar: Maybe<string>;
		description: Maybe<string>;
		name: Maybe<string>;
	};
	entrance: {
		password: Maybe<string>;
		requests: APIGroupRequest[];
	};
	status: GroupStatusType;
	ownerId: string;
	data: {
		users: string[];
		channelLimit: number;
	};
	locale: Maybe<LocaleString>;
	id: string;
	tag: string;
	bans: string[];
	settings: GroupSettings
}

export type GroupSettings = {
	maxCharacterLimit: number;
	requests: {
		deleteDuplicate: boolean;
	};
};

export interface APIChannelRegistry {
	id: string;
	webhookurl: Maybe<string>;
	guildId: string;
	groupId: Maybe<string>;
}

export type GroupResolvable = string | ChannelRegistry | Group;

export type RegisterableChannel = TextChannel | NewsChannel;

export type RegistryCreateOptions = {
	channel: RegisterableChannel;
	url: Maybe<string>;
	groupId: Maybe<string>;
};
