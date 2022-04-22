import type { Snowflake } from "@sapphire/snowflake";
import type { ChannelType } from "discord-api-types/v10";
import type {
	ApplicationCommandOptionData,
	AutocompleteInteraction,
	Awaitable,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	PermissionResolvable,
} from "discord.js";
import { Collection } from "discord.js";
import type { APIApplicationCommand } from "discord.js/node_modules/discord-api-types/v10";
import { Converters } from "../utils/converters";

export class Command {
	public readonly data: CommandConstructor["data"];
	public cooldowns = new Collection<string, number>();
	public path?: string;
	private readonly restraints: CommandConstructor["restraints"];

	constructor(data: CommandConstructor) {
		this.data = data.data;
		this.restraints = data.restraints;
	}

	/**
	 * Executes the application command's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public chatInputRun?(
		interaction: ChatInputCommandInteraction
	): Awaitable<unknown>;

	/**
	 * Executes the context menu's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public contextMenuRun?(
		interaction: ContextMenuCommandInteraction
	): Awaitable<unknown>;

	/**
	 * Executes the autocomplete command's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public autocompleteRun?(
		interaction: AutocompleteInteraction
	): Awaitable<unknown>;

	/**
	 * Whether this command supports chat input interaction.
	 * @returns {boolean}
	 */
	public supportChatInput(): this is ChatInputCommand {
		return Reflect.has(this, "chatInputRun");
	}
	/**
	 * Whether this command supports context menu interaction.
	 * @returns {boolean}
	 */
	public supportContextMenu(): this is ContextMenuCommand {
		return Reflect.has(this, "supportContextMenu");
	}
	/**
	 * Whether this command supports autocomplete interaction.
	 * @returns {boolean}
	 */
	public supportAutocomplete(): this is AutocompleteCommand {
		return Reflect.has(this, "autocompleteRun");
	}
	/**
	 * Whether this command is set to be global.
	 */
	public isGlobal() {
		return this.restraints?.global ?? false;
	}

	public toJSON(): Omit<APIApplicationCommand, 'version' | 'description_localized' | 'name_localized' | 'guild_id' | 'application_id' | 'id'> {
		//@ts-expect-error
		return Converters.camelCaseKeysToUnderscore(this.data)
	}
}

export type ContextMenuCommand = Command &
	Required<Pick<Command, "contextMenuRun">>;
export type AutocompleteCommand = Command &
	Required<Pick<Command, "autocompleteRun">>;
export type ChatInputCommand = Command &
	Required<Pick<Command, "chatInputRun">>;

export enum CooldownScope {
	Global = 0,
	Channel = 1,
	Guild = 2,
	User = 3,
}

export interface CommandConstructor {
	data: {
		name: string;
		description: string;
		options?: ApplicationCommandOptionData[];
	};
	help?: {
		usage?: string;
		examples?: string[][];
	};
	preconditions?: {
		canRunIn?: ChannelType[];
		elevatedPermissions?: boolean;
		requiredClientPermissions?: PermissionResolvable[];
		requiredUserPermissions?: PermissionResolvable[];
	};
	restraints?: {
		global?: boolean;
		enabled?: boolean;
		cooldowns?: {
			scope?: CooldownScope;
			delay?: number;
			ignore?: Snowflake[];
		};
	};
}
