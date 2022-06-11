import type { Result } from '@sapphire/shapeshift';
import type { Awaitable, ChannelResolvable, LocaleString, Message, NewsChannel, TextChannel, User, UserResolvable } from 'discord.js';
import type { APIMessage } from 'discord.js';
import type { Ban, ChannelRegistry, Group } from '../structures/';
import type { BanType, GroupPermissionsFlagBits, GroupStatusType, RequestState, RequestType, SettingCategory, SettingType } from './enums';

export type Maybe<T> = T | null;
export type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;
export type CommandAndEventLoadOptions = {
	errorOnNoMatches?: boolean;
	errorOnEmptyFile?: boolean;
};

export type PathsToStringProps<T> = T extends string
	? []
	: {
			[K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
	  }[Extract<keyof T, string>];

export type Join<T extends string[], D extends string> = T extends []
	? never
	: T extends [infer F]
	? F
	: T extends [infer F, ...infer R]
	? F extends string
		? `${F}${D}${Join<Extract<R, string[]>, D>}`
		: never
	: string;

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

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

export type BanResolvable = string | ChannelResolvable | UserResolvable | Ban;

export interface BaseAPIBan {
	target: string;
	executor: string;
	reason: Maybe<string>;
	type: BanType;
	location: Maybe<string>;
	until: Maybe<number>;
}

export interface BaseAPIGroupBan extends BaseAPIBan {
	type: BanType.Guild | BanType.User;
	location: string;
}

export interface BaseAPIGlobalBan extends BaseAPIBan {
	type: BanType.Global;
	location: null;
}

export interface APIGroupMessage {
	original: Maybe<Message>;
	message: APIMessage;
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

type APISettingData = APIStringSetting | APIChoicesSetting;

interface APIStringSetting extends BaseAPISetting {
	type: SettingType.String;
	validate?: (value: string, group?: Group) => string;
	restraints?: {
		maxLength?: number;
		minLength?: number;
	};
}

interface APIChoicesSetting extends BaseAPISetting {
	validate?: (value: string, group: Group | undefined) => string;
	options: Choice[];
	type: SettingType.Choices;
	default?: string | null;
}

interface Choice {
	name: string;
	description?: string;
	value: string;
}

interface BaseAPISetting {
	/**
	 * The name of this setting.
	 */
	name: string;

	/**
	 * The description of the setting
	 */
	description?: string;

	/**
	 * The dots path of the target property of the group object where this setting will modify.
	 */
	path: Join<PathsToStringProps<APIGroup>, '.'>;

	/**
	 * The default value for this settings.
	 */
	default?: string | boolean | number | null;

	/**
	 * The type of this setting.
	 */
	type: SettingType;

	help?: {
		category?: SettingCategory;
		preview?: '';
	};

	preconditions?: (group: Group, user?: User) => any
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
	settings: GroupSettings;
}

export type GroupSettings = {
	maxCharacterLimit: number;
	requests: {
		deleteDuplicate: boolean;
	};
	logChannelId: Maybe<string>;
};

export interface APIChannelRegistry {
	id: string;
	url: Maybe<string>;
	guildId: string;
	groupId: Maybe<string>;
}

export type GroupResolvable = string | ChannelRegistry | Group;

export type RegisterableChannel = TextChannel | NewsChannel;

export type RegistryCreateOptions = {
	channelId: RegisterableChannel | string;
	url: Maybe<string>;
	groupId: Maybe<string>;
};
