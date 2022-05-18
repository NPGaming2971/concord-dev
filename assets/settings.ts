import { from, Result } from '@sapphire/result';
import { GroupPermissionsBitfield } from '../src/structures';
import type { GroupPermissionsString } from '../src/typings';

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
	default: string | null;
}

interface BooleanSetting extends BaseSetting {
	type: SettingType.Boolean;
	default: boolean | null;
}

interface ChoiceOption {
	name: string;
	description?: string;
	value: string;
}

interface StringSetting extends BaseSetting {
	type: SettingType.String;
	restraints?: {
		requiredGroupPermissions?: GroupPermissionsString[];
		lengthRange?: [number | null, number | null];
	};
	default: string | null;
	validate: (value: string) => Result<void, string>;
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
	default: string | boolean | null;
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
		name: 'Group Name',
		type: SettingType.String,
		validate: () => {
			return from(() => {});
		},
		default: null,
		path: 'appearances.name',
		help: {
			category: CategoryType.Appearances
		}
	},
	{
		name: 'Group Status',
		type: SettingType.Choices,
		path: 'status',
		default: 'public',
		options: [
			{
				name: "Public",
				value: "public",
			},
			{
				name: "Restricted",
				value: "restricted",
			},
			{
				name: "Protected",
				value: "protected",
			},
			{
				name: "Private",
				value: "private",
			},
		],
		help: { category: CategoryType.Security }
	}
];

export default data.map((i) => new Setting(i));
