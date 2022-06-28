import type { ChannelResolvable, LocaleString, Message, NewsChannel, TextChannel, TextInputStyle, User, UserResolvable, VoiceChannel } from 'discord.js';
import type { APIMessage } from 'discord.js';
import type { Ban, ChannelRegistry, Group } from '../structures/';
import type { BanTargetType, GroupPermissionsFlagBits, GroupStatusType, PreviewLocation, RequestState, RequestType, SettingCategory, SettingType } from './enums';

export type Maybe<T> = T | null;
export type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;
export type DeepNonNull<T> = NonNullable<{ [P in keyof T]: DeepNonNull<T[P]> }>;

export type PathImpl<T, K extends keyof T> = K extends object
	? never
	: K extends string
	? T[K] extends Record<string, any>
		? T[K] extends ArrayLike<any>
			? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
			: K | `${K}.${PathImpl<T[K], keyof T[K]>}`
		: K
	: never;

export type Path<T> = PathImpl<T, keyof T> | keyof T;

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

export type GroupPermissionsString = keyof typeof GroupPermissionsFlagBits;

export type CommandLoadOptions = {
	path: Partial<{
		commands: string;
		events: string;
	}>;
	/**
	 * Accepted file extensions. Default to ['ts'].
	 */
	extensions?: string[];
	subfolderDepth?: number;
	deploy?: boolean;
	root?: string
	errors?: CommandLoadError[];
};

export type CommandLoadError = 'NoMatches' | 'EmptyFile'

export type NonNullObject = {} & object;

export type BanResolvable = string | ChannelResolvable | UserResolvable | Ban;

export interface BaseAPIBan {
	id: string
	targetId: string;
	executorId: string;
	reason: Maybe<string>;
	targetType: BanTargetType;
	location: Maybe<string>;
	until: Maybe<number>;
}

export interface APIGlobalBan extends BaseAPIBan {
	location: null
}

export interface APIGroupBan extends BaseAPIBan {
	location: string
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

type APISettingData = APIStringSetting | APIChoicesSetting | APINumberSetting | APIImageSetting;

interface APINumberSetting extends BaseAPISetting {
	type: SettingType.Number;
	validate?: (value: number, group?: Group) => number;
	restraints?: {
		maxValue?: number;
		minValue?: number;
	};
}

interface APIImageSetting extends BaseAPISetting {
	type: SettingType.Image;
	validate?: (value: string, group?: Group) => Maybe<string>;
	restraints?: {
		maxWidth?: number;
		maxHeight?: number;
		allowEmpty?: boolean
	};
	preview?: PreviewLocation
}

interface APIStringSetting extends BaseAPISetting {
	type: SettingType.String;
	validate?: (value: string, group?: Group) => Maybe<string>;
	restraints?: {
		maxLength?: number;
		minLength?: number;
		/**
		 * Whether to allow empty string as a valid value.  
		 * If this is `false`, empty string will be automatically converted to `null`.  
		 * If this is `true`, `validate()` function will have to handle empty string itself.
		 */
		allowEmpty?: boolean
	};
	style?: TextInputStyle;
}

interface APIChoicesSetting extends BaseAPISetting {
	validate?: (value: string, group?: Group) => string;
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
	path: Path<APIGroup>;

	/**
	 * The default value for this settings.
	 */
	default?: string | number | boolean | null;

	/**
	 * The type of this setting.
	 */
	type: SettingType;

	help?: {
		category?: SettingCategory;
		preview?: '';
	};

	/**
	 * Whether this setting can be null
	 */
	nullable?: boolean;

	/**
	 * Whether to force use ephemeral for this setting
	 */
	ephemeral?: boolean;

	preconditions?: (group: Group, user?: User) => any;
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

export type RegisterableChannel = TextChannel | NewsChannel | VoiceChannel;

export type RegistryCreateOptions = {
	channelId: RegisterableChannel | string;
	url: Maybe<string>;
	groupId: Maybe<string>;
};
