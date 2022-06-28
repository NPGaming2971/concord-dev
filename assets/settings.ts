import { from, fromAsync, Result } from '@sapphire/result';
import { TextInputStyle, User } from 'discord.js';
import imageSize from 'image-size';
import type { Group } from '../src/structures';
import type { APISettingData, Choice } from '../src/typings';
import fetch, { Blob } from 'node-fetch';
import { GroupStatusType, PreviewLocation, SettingCategory, SettingType } from '../src/typings/enums';
import { Converters } from '../src/utils';
import { isUndefined } from 'lodash';

type PossibleSettingDataType = string | boolean | number | null;
export class Setting {
	private noop = <T>(value: T) => {
		return value;
	};

	constructor(data: APISettingData) {
		this.name = data.name;

		this.description = data.description;

		this.path = data.path;

		this.type = data.type;

		this.default = data.default;

		this.preconditions = (group: Group, user?: User) => from(() => (data.preconditions ?? this.noop)(group, user));

		this.category = data.help?.category ?? 'Uncategorized';

		this.ephemeral = data.ephemeral ?? false;

		this.nullable = data.nullable ?? true;

		if (this.isString() && data.type === SettingType.String) {
			const allowEmpty = data.restraints?.allowEmpty ?? true;

			this.restraints = {
				maxLength: data.restraints?.maxLength ?? 4000,
				minLength: data.restraints?.minLength ?? 0,
				allowEmpty
			};

			this.format = {
				style: data.style ?? TextInputStyle.Short
			};

			this.validate = (value: string, group?: Group) =>
				fromAsync(() => {
					if (allowEmpty && !value.length) return null;
					return (data.validate ?? this.noop)(value, group);
				});
		}

		if (this.isChoices() && data.type === SettingType.Choices) {
			this.options = data.options;

			this.validate = (value: string, group?: Group) => fromAsync(() => (data.validate ?? this.noop)(value, group));
		}

		if (this.isImage() && data.type === SettingType.Image) {
			const maxHeight = data.restraints?.maxHeight ?? Infinity;
			const maxWidth = data.restraints?.maxWidth ?? Infinity;
			const allowEmpty = data.restraints?.allowEmpty ?? true;

			this.restraints = {
				maxHeight,
				maxWidth,
				allowEmpty
			};

			this.format = {
				style: TextInputStyle.Paragraph,
				preview: data.preview ?? PreviewLocation.Image
			};

			this.validate = (value: string, group?: Group) =>
				fromAsync(async () => {
					if (allowEmpty && !value.length) return null;

					this.validateURL(value);
					const blob = await fetch(value);
					const cloned = blob.clone();

					const buff = await blob.blob();

					if (!this._isImage(buff)) throw new Error('URL does not point to a valid image resource.');
					this.validateImageSize(await cloned.buffer(), [maxWidth, maxHeight]);

					return (data.validate ?? this.noop)(value, group);
				});
		}

		if (this.isNumber() && data.type === SettingType.Number) {
			this.restraints = {
				maxValue: data.restraints?.maxValue ?? Infinity,
				minValue: data.restraints?.minValue ?? -Infinity
			};

			this.format = {
				style: TextInputStyle.Paragraph
			}

			const range = [this.restraints.minValue, this.restraints.maxValue] as [number, number];

			this.validate = (value: number, group?: Group) =>
				fromAsync(() => {
					this._formatNumber(value)
					this.validateNumberRange(value, range);
					return (data.validate ?? this.noop)(value, group);
				});
		}
	}

	public isInputtable(): this is ImageSetting | StringSetting | NumberSetting {
		return [SettingType.Image, SettingType.String, SettingType.Number].includes(this.type)
	}

	public isImage(): this is ImageSetting {
		return this.type === SettingType.Image;
	}

	public isString(): this is StringSetting {
		return this.type === SettingType.String;
	}

	public isBoolean(): this is BooleanSetting {
		return this.type === SettingType.Boolean;
	}

	public isChoices(): this is ChoicesSetting {
		return this.type === SettingType.Choices;
	}

	public isNumber(): this is NumberSetting {
		return this.type === SettingType.Number;
	}

	private validateNumberRange(n: number, range: [number, number]) {
		const [low, high] = range;
		if (n < low) {
			throw new RangeError(`Received number (${n}) is smaller than the lower range limit (${low}).`);
		} else if (n > high) {
			throw new RangeError(`Received number (${n}) is higher than the higher range limit (${high}). `);
		}
	}

	private validateURL(testValue: string) {
		const URLValidationRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
		if (!URLValidationRegex.test(testValue)) {
			throw new Error('Not a valid URL.');
		}
		return;
	}

	private _isImage(buff: Blob): boolean {
		return buff.type.startsWith('image/');
	}
	private validateImageSize(buffer: Buffer, [w, h]: [number, number]) {
		const dimensions = imageSize(buffer);
		if (!dimensions.type) throw new Error(`Unsupported image type.`);
		if (dimensions.height! !== h || dimensions.width! !== w) {
			throw new Error(`Invalid image size (${dimensions.width}x${dimensions.height}).`);
		}
		return;
	}

	private _formatNumber(value: any) {
		const parsed = Converters.parseStringToNumber(value)

		if (isUndefined(parsed)) throw new TypeError(`\`${value}\` is not a valid number.`)

		return parsed
	}
}

const data: APISettingData[] = [
	{
		name: 'Status',
		description: 'Group status',
		path: 'status',
		default: 'public',
		type: SettingType.Choices,
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
		validate: (value, group) => {
			if (value === 'protected' && !group?.password?.length) {
				throw new Error('You must set your entrance password first to unlock this status setting.');
			}
			return value;
		},
		help: {
			category: SettingCategory.Security
		}
	},
	{
		name: 'Tag',
		description: 'The tag used to identify your group.',
		type: SettingType.String,
		path: 'tag',
		restraints: {
			maxLength: 32,
			minLength: 3
		},
		validate: (value, group) => {
			if (!/^[a-z\d\-_]{3,32}$/gi.test(value))
				throw new Error('Group tag can only contains `[a-z]`, `[A-Z]`, `[0-9]`, `-`, `_` characters and may not contain space.');

			if (group?.client.groups.cache.find((i) => i.tag.toLowerCase() === value.toLowerCase())) {
				throw new Error('Group with such tag already existed.');
			}
			return value;
		},
		nullable: false
	},
	{
		name: 'Password',
		description:
			'Set your group password. New channels joining this group will be required to input this password if this group status is `protected`.',
		path: 'entrance.password',
		type: SettingType.String,
		ephemeral: true,
		help: {
			category: SettingCategory.Security
		},
		restraints: {
			allowEmpty: false
		},
		validate: (value, group) => {
			if (!value.length) {
				if (group?.status === GroupStatusType.Protected) {
					throw new Error('Password must be present if the group is in `protected` status.');
				} else return null
			}
			return value;
		}
	},
	{
		name: 'Name',
		description: 'Your group name.',
		type: SettingType.String,
		validate: (value: string) => {
			if (!/^[a-z\d\-_ ]{3,32}$/gi.test(value)) throw new Error('Group name can only contains `[a-z]`, `[A-Z]`, `[0-9]`, `-`, `_` characters.');
			return value;
		},
		path: 'appearances.name',
		default: null,
		help: {
			category: SettingCategory.Appearances
		}
	},
	{
		name: 'Description',
		path: 'appearances.description',
		help: {
			category: SettingCategory.Appearances
		},
		description: 'Write something about your group!',
		type: SettingType.String,
		default: null,
		restraints: {
			maxLength: 500
		},
		style: TextInputStyle.Paragraph
	},
	{
		name: 'Max message characters limit',
		path: 'settings.maxCharacterLimit',
		help: {
			category: SettingCategory.Appearances
		},
		description: 'The character limit of a message sent in your group.',
		type: SettingType.Number,
		default: 1850,
		restraints: {
			maxValue: 1850,
			minValue: 1
		}
	},
	{
		name: 'Avatar',
		path: 'appearances.avatar',
		help: {
			category: SettingCategory.Appearances
		},
		description: 'Set your group avatar.',
		type: SettingType.Image,
		default: null,
		preview: PreviewLocation.Thumbnail
	},
	{
		name: 'Banner',
		path: 'appearances.banner',
		help: {
			category: SettingCategory.Appearances
		},
		description: 'Set your group banner (1920x1080).',
		type: SettingType.Image,
		default: null,
		restraints: {
			maxWidth: 1080,
			maxHeight: 1920
		}
	}
];

export interface Setting {
	name: string;

	description?: string;

	type: SettingType;

	path: APISettingData['path'];

	default?: PossibleSettingDataType;

	category: SettingCategory | 'Uncategorized';

	nullable: boolean;

	ephemeral: boolean;

	preconditions: (group: Group, user?: User) => Result<boolean, Error>;
}

export interface ImageSetting extends Setting {
	validate: (value: string, group?: Group) => Promise<Result<string | null, Error>>;
	default?: string | null;

	restraints: {
		maxWidth: number;
		maxHeight: number;
		allowEmpty: boolean;
	};

	format: {
		style: TextInputStyle;
		preview: PreviewLocation;
	};
}

export interface StringSetting extends Setting {
	validate: (value: string, group?: Group) => Promise<Result<string | null, Error>>;

	restraints: {
		maxLength: number;
		minLength: number;
		allowEmpty: boolean;
	};
	default?: string | null;

	format: {
		style: TextInputStyle;
	};
}

export interface NumberSetting extends Setting {
	validate: (value: number, group: Group) => Promise<Result<number, Error>>;
	type: SettingType.Number;

	restraints: {
		maxValue: number;
		minValue: number;
	};

	default?: number | null;

	format: {
		style: TextInputStyle;
	};
}

export interface BooleanSetting extends Setting {
	type: SettingType.Boolean;
	default?: boolean | null;
}

export interface ChoicesSetting extends Setting {
	validate: (value: string, group?: Group) => Promise<Result<string, Error>>;
	options: Choice[];
	default?: string | null;
}
export default data.map((i) => new Setting(i));

// 	public validateSetting() {
// 		if (this.isString()) {
// 			if (this.default && !this.default.length) throw new Error('Default field can not be empty.');

// 			if (this.path && !this.path.length) throw new Error('Path field can not be empty.');
// 		}
// 	}

// const data: SettingData[] = [
// 	{
// 		name: 'Delete Duplicate',
// 		description: 'Automatically delete duplicated requests from the same channel.',
// 		default: true,
// 		path: 'settings.requests.deleteDuplicate',
// 		type: SettingType.Boolean,
// 		help: {
// 			category: CategoryType.Requests
// 		}
// 	},
//
// 	{
// 		name: 'Max Character Limit',
// 		path: 'settings.maxCharacterLimit',
// 		default: 2000,
// 		type: SettingType.Number,
// 		description: 'The character limit of a message sent in your group.',
// 		help: {
// 			category: CategoryType.Appearances
// 		},
// 		restraints: {
// 			range: [0, 1900]
// 		},
// 		validate: function (value: number) {
// 			const range = this.restraints?.range;
// 			validateNumberRange(value, range);
// 		}
// 	}, {
// 	{
// 		name: 'Log Channel',
// 		path: 'settings.logChannelId',
// 		help: {
// 			category: CategoryType.Security
// 		},
// 		description: 'Set your group log channel.',
// 		type: SettingType.String,
// 		default: null,
// 		validate: (newValue: string, group?: Group, user?: User) => {
// 			return validateLogChannel(newValue, group!, user!);
// 		}
// 	}
// ];

// function validateImageSize(buffer: Buffer, [w = Infinity, h = Infinity]: [number, number] = [Infinity, Infinity]) {
// 	const dimensions = imageSize(buffer);

// 	if (!dimensions.type) throw new Error(`Unsupported image type.`);

// 	if (dimensions.height! > h || dimensions.width! > w) {
// 		throw new Error(`Invalid image size (${dimensions.width}x${dimensions.height}).`);
// 	}
// 	return;
// }

// function validateLogChannel(value: string, group: Group, user: User) {
// 	const existing = group.client.channels.cache.get(value);

// 	if (!existing) throw new Error('No channel exists with such id.');

// 	if (!existing.isRegisterable()) throw new Error('Invalid channel type.');

// 	if (!existing.permissionsFor(group.client.user!)?.has('ManageWebhooks')) {
// 		throw new Error('Missing permissions to create webhooks on that channel.');
// 	}
// 	if (!existing.permissionsFor(user)?.has('ManageChannels')) {
// 		throw new Error('You do not have permissions to manage this channel.');
// 	}

// 	return;
// }
