import { from, fromAsync, Result } from '@sapphire/result';
import { Awaitable, TextInputStyle } from 'discord.js';
import { GroupPermissionsBitfield } from '../src/structures';
import type { GroupPermissionsString } from '../src/typings';
import { Util } from '../src/utils';
const { isImage } = Util;

const DefaultValidate = (): Result<void, string> => from(() => {});

export class Setting {
	constructor(data: SettingData) {
		this.name = data.name;
		this.description = data.description;

		this.path = data.path;
		this.default = data.default;

		this.restraints = data.restraints ?? { requiredGroupPermissions: [] };
		this.type = data.type;

		this.help = data.help;

		if (this.isChoices() && data.type === SettingType.Choices) {
			this.options = data.options;
		}

		if (this.isString() && data.type === SettingType.String) {
			this.validate = data.validate;

			this.style = data.style;

			this.restraints.lengthRange = data.restraints?.lengthRange ?? [null, null];
		}

		this.validateSetting();
	}

	public validateSetting() {
		if (this.isString()) {
			if (this.default && !this.default.length) throw new Error('Default field can not be empty.');

			if (this.path && !this.path.length) throw new Error('Path field can not be empty.');
		}
	}

	public checkMissingPermissions(permissions: GroupPermissionsBitfield) {
		return new GroupPermissionsBitfield(this.restraints?.requiredGroupPermissions).missing(permissions);
	}

	public isChoices(): this is ChoicesSetting {
		return this.type === SettingType.Choices;
	}

	public isString(): this is StringSetting {
		return this.type === SettingType.String;
	}

	public isBoolean(): this is BooleanSetting {
		return this.type === SettingType.Boolean;
	}
}

type SettingData = ChoicesSetting | StringSetting | BooleanSetting;

export interface Setting extends BaseSetting {}

interface ChoicesSetting extends BaseSetting {
	type: SettingType.Choices;
	options: ChoiceOption[];
	default: string | number | null;
}

interface BooleanSetting extends BaseSetting {
	type: SettingType.Boolean;
	default: boolean | null;
}

interface ChoiceOption {
	name: string;
	description?: string;
	value: string | number;
}

interface StringSetting extends BaseSetting {
	type: SettingType.String;
	restraints?: {
		requiredGroupPermissions?: GroupPermissionsString[];
		lengthRange?: [number | null, number | null];
	};
	default: string | null;
	validate: (value: string) => Awaitable<Result<void, string>>;
	style?: TextInputStyle;
}

enum SettingType {
	String = 'string',
	Choices = 'choices',
	Boolean = 'boolean'
}

interface BaseSetting {
	name: string;
	description?: string;
	/**
	 * Default value for this settings.
	 */
	default: string | number | boolean | null;
	/**
	 * Group property access path.
	 */
	path: string;

	type: SettingType;
	restraints?: {
		/**
		 * The required group permission(s) to change this setting.
		 */
		requiredGroupPermissions?: GroupPermissionsString[];
	};
	help?: {
		/**
		 * Category of this setting
		 */
		category?: CategoryType;
		/**
		 * Image preview link of this setting.
		 */
		preview?: string;
	};
}

export enum CategoryType {
	Appearances = 'Appearances',
	Security = 'Security'
}

const data: SettingData[] = [
	{
		name: 'Name',
		description: 'Your group name.',
		type: SettingType.String,
		validate: (value: string) => {
			return from(() => {
				if (/^[a-z\d\-_ ]{3,32}$/gi.test(value)) return;
				throw new Error('Group name can only contains `[a-z]`, `[A-Z]`, `[0-9]`, `-`, `_` characters.');
			});
		},
		default: null,
		path: 'appearances.name',
		help: {
			category: CategoryType.Appearances
		},
		restraints: {
			lengthRange: [2, 32]
		}
	},
	{
		name: 'Status',
		description: 'Control this group accessibility to others.',
		type: SettingType.Choices,
		path: 'status',
		default: 'public',
		options: [
			{
				name: 'Public',
				value: 'public',
				description: 'Your group would be accessible by anyone that have your group tag or id.'
			},
			{
				name: 'Restricted',
				value: 'restricted',
				description:
					'Users would have to send a request upon joining which would have to be manually accepted by another user with `Manage Members` group permissions to grant membership.'
			},
			{
				name: 'Protected',
				value: 'protected',
				description: 'Your group would require a password for entrance. Must set a password first to set this status.'
			},
			{
				name: 'Private',
				value: 'private',
				description: 'The group would not be accessible by anyone except the group owner, by any means.'
			}
		],
		help: { category: CategoryType.Security }
	},
	{
		name: 'Max Character Limit',
		path: 'settings.maxCharacterLimit',
		default: 'dynamic',
		type: SettingType.Choices,
		description: 'The character limit of a message sent in your group.',
		options: [],
		help: {
			category: CategoryType.Appearances
		}
	},
	{
		name: 'Description',
		path: 'appearances.description',
		help: {
			category: CategoryType.Appearances
		},
		description: 'Write something about your group!',
		type: SettingType.String,
		default: null,
		restraints: {
			lengthRange: [null, 500]
		},
		validate: DefaultValidate,
		style: TextInputStyle.Paragraph
	},
	{
		name: 'Avatar',
		path: 'appearances.avatar',
		help: {
			category: CategoryType.Appearances
		},
		description: 'Set your group avatar.',
		type: SettingType.String,
		default: null,
		validate: (newValue: string) => {
			return fromAsync<void, string>(validateImage(newValue));
		}
	}
];

async function validateImage(testValue: string) {
	const URLValidationRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
	if (!URLValidationRegex.test(testValue)) {
		throw new Error('Not a valid URL.');
	} else if (!(await isImage(testValue))) {
		throw new Error('URL does not point to a valid image resource.');
	} else return;
}

export default data.map((i) => new Setting(i));
