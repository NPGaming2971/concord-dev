import type { ChannelResolvable, LocaleString, Message, NewsChannel, TextChannel, User, UserResolvable } from 'discord.js';
import type { APIMessage } from 'discord.js';
import type { Ban, ChannelRegistry, Group } from '../structures/';
import type { BanType, GroupPermissionsFlagBits, GroupStatusType, RequestState, RequestType } from './enums';

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

export type BanResolvable = string | ChannelResolvable | UserResolvable | Ban

export interface BaseAPIBan {
	target: string
	executor: string
	reason: Maybe<string>
	type: BanType
	location: Maybe<string>
	until: Maybe<number>
}

export interface BaseAPIGroupBan extends BaseAPIBan {
	type: BanType.Guild | BanType.User
	location: string
}

export interface BaseAPIGlobalBan extends BaseAPIBan {
	type: BanType.Global
	location: null
}

export interface APIGroupMessage {
	original: Maybe<Message>;
	message: APIMessage
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
