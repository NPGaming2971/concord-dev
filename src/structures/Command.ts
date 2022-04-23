import type { Snowflake } from "@sapphire/snowflake";
import type { ChannelType } from "discord-api-types/v10";
import {
	ApplicationCommandData,
	ApplicationCommandOptionData,
	ApplicationCommandType,
	AutocompleteInteraction,
	Awaitable,
	ChatInputCommandInteraction,
	MessageContextMenuCommandInteraction,
	PermissionResolvable,
	UserContextMenuCommandInteraction,
} from "discord.js";
import { Collection } from "discord.js";
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
	public chatInputRun?(interaction: ChatInputCommandInteraction): Awaitable<unknown>;

	/**
	 * Executes the message context menu's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public messageContextMenuRun?(
		interaction: MessageContextMenuCommandInteraction
	): Awaitable<unknown>;

	/**
	 * Executes the user context menu's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public userContextMenuRun?(interaction: UserContextMenuCommandInteraction): Awaitable<unknown>;

	/**
	 * Executes the autocomplete command's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public autocompleteRun?(interaction: AutocompleteInteraction): Awaitable<unknown>;

	/**
	 * Whether this command supports chat input interaction.
	 * @returns {boolean}
	 */
	public supportChatInput(): this is ChatInputCommand {
		return Reflect.has(this, "chatInputRun");
	}

	/**
	 * Whether this command supports message context menu interaction.
	 * @returns {boolean}
	 */
	public supportMessageContextMenu(): this is MessageContextMenuCommand {
		return Reflect.has(this, "messageContextMenuRun");
	}

	/**
	 * Whether this command supports user context menu interaction.
	 * @returns {boolean}
	 */
	public supportUserContextMenu(): this is UserContextMenuCommand {
		return Reflect.has(this, "userContextMenuRun");
	}

	/**
	 * Whether this command supports context menu interaction.
	 * @returns {boolean}
	 */
	public supportContextMenu(): this is ContextMenuCommand {
		return Reflect.has(this, "userContextMenuRun") || Reflect.has(this, "messageContextMenuRun");
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

	public toJSON(): ApplicationCommandData[] {
		const data: ApplicationCommandData[] = [];

		const { description, name, options } = this.data;

		if (this.supportContextMenu()) {
			data.push(
				Converters.camelCaseKeysToUnderscore({
					description,
					name,
					type: this.supportMessageContextMenu()
						? ApplicationCommandType.Message
						: ApplicationCommandType.User,
				})
			);
		}

		if (this.supportChatInput()) {
			data.push(
				Converters.camelCaseKeysToUnderscore({
					description,
					name,
					options,
					type: ApplicationCommandType.ChatInput,
				})
			);
		}
		return data
	}
}

export type ContextMenuCommand = MessageContextMenuCommand | UserContextMenuCommand;

export type MessageContextMenuCommand = Command & Required<Pick<Command, "messageContextMenuRun">>;

export type UserContextMenuCommand = Command & Required<Pick<Command, "userContextMenuRun">>;

export type AutocompleteCommand = Command & Required<Pick<Command, "autocompleteRun">>;

export type ChatInputCommand = Command & Required<Pick<Command, "chatInputRun">>;

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
