import { TextInputStyle } from 'discord.js';
import { Group, GroupPermissionsBitfield } from '../src/structures';
import type { GroupPermissionsString, Maybe } from '../src/typings';
import { GroupStatusType } from '../src/typings/enums';
import { Converters, Util } from '../src/utils';
const { isImage } = Util;
import { imageSize } from 'image-size';
import fetch from 'node-fetch';
export enum CategoryType {
	Appearances = 'Appearances',
	Security = 'Security',
	Requests = 'Requests'
}

enum SettingType {
	String = 'string',
	Choices = 'choices',
	Boolean = 'boolean',
	Number = 'number'
}

const DefaultValidate = () => {};

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

			this.style = data.style ?? TextInputStyle.Short;

			this.hidden = data.hidden ?? false;

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

	public isNumber(): this is NumberSetting {
		return this.type === SettingType.Number;
	}

	public isString(): this is StringSetting {
		return this.type === SettingType.String;
	}

	public isBoolean(): this is BooleanSetting {
		return this.type === SettingType.Boolean;
	}
}

const data: SettingData[] = [
	{
		name: 'Name',
		description: 'Your group name.',
		type: SettingType.String,
		validate: (value: string) => {
			if (/^[a-z\d\-_ ]{3,32}$/gi.test(value)) return;
			throw new Error('Group name can only contains `[a-z]`, `[A-Z]`, `[0-9]`, `-`, `_` characters.');
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
		name: 'Password',
		description:
			'Set your group password. New channels joining this group will be required to input this password if this group status is `protected`.',
		default: null,
		path: 'entrance.password',
		type: SettingType.String,
		validate: (_, group) => {
			if (group?.status !== GroupStatusType.Protected) throw new Error('Your group status settings must be `protected` to use this settings.');
		},
		help: {
			category: CategoryType.Security
		},
		style: TextInputStyle.Short,
		hidden: true
	},
	{
		name: 'Delete Duplicate',
		description: 'Automatically delete duplicated requests from the same channel.',
		default: true,
		path: 'settings.requests.deleteDuplicate',
		type: SettingType.Boolean,
		help: {
			category: CategoryType.Requests
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
		default: 2000,
		type: SettingType.Number,
		description: 'The character limit of a message sent in your group.',
		help: {
			category: CategoryType.Appearances
		},
		restraints: {
			range: [0, 1900]
		},

		validate: function (value: number) {
			const range = this.restraints?.range;
			validateNumberRange(value, range);
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
			return validateImage(newValue);
		}
	},
	{
		name: 'Banner',
		path: 'appearances.banner',
		help: {
			category: CategoryType.Appearances
		},
		description: 'Set your group banner (1920x1080).',
		type: SettingType.String,
		default: null,
		validate: async (newValue: string) => {
			validateImage(newValue);
			return fetch(newValue).then(i => i.buffer()).then(e => {
				validateImageSize(e, [1920, 1080])
			})
		}
	}
];

type SettingData = ChoicesSetting | StringSetting | BooleanSetting | NumberSetting;

export interface Setting extends BaseSetting {}

interface ChoicesSetting extends BaseSetting {
	type: SettingType.Choices;
	options: ChoiceOption[];
	default: Maybe<string | number>;
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

interface NumberSetting extends BaseSetting {
	type: SettingType.Number;
	restraints?: {
		requiredGroupPermissions?: GroupPermissionsString[];
		range?: [Maybe<number>, Maybe<number>];
	};
	default: Maybe<number>;
	validate: ValidateFunction<number>;
}

interface StringSetting extends BaseSetting {
	type: SettingType.String;
	restraints?: {
		requiredGroupPermissions?: GroupPermissionsString[];
		lengthRange?: [Maybe<number>, Maybe<number>];
	};
	default: string | null;
	validate: ValidateFunction<string>;
	style?: TextInputStyle;
	hidden?: boolean;
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

type ValidateFunction<T> = (value: T, group?: Group) => void;

function validateNumberRange(n: number, range: [Maybe<number>, Maybe<number>] = [null, null]) {
	const [low = -Infinity, high = Infinity] = range;

	if (n < low!) {
		throw new RangeError('LOWER_THAN_RANGE');
	} else if (n > high!) {
		throw new RangeError('HIGHER_THAN_RANGE');
	}
}

//@ts-expect-error
function validateNumberString(value: string) {
	const parsed = Converters.parseString(value);

	if (!parsed) throw new TypeError('Not a valid number.');
}

function validateImageSize(buffer: Buffer, [w = Infinity, h = Infinity]: [number, number] = [Infinity, Infinity]) {
	const dimensions = imageSize(buffer);

	if (!dimensions.type) throw new Error(`Unsupported image type.`)

	if ((dimensions.height! > h) || (dimensions.width! > w)) {
		throw new Error(`Invalid image size (${dimensions.width}x${dimensions.height}).`);
	}
	return;
}

async function validateImage(testValue: string) {
	const URLValidationRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
	if (!URLValidationRegex.test(testValue)) {
		throw new Error('Not a valid URL.');
	} else if (!(await isImage(testValue))) {
		throw new Error('URL does not point to a valid image resource.');
	} else return;
}

export default data.map((i) => new Setting(i));
