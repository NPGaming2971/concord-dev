import type { Snowflake } from "@sapphire/snowflake";
import { ChannelType, LocalizationMap, PermissionsBitField } from "discord.js";
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
import { Converters } from "../../utils/Converters";

export abstract class Command {
	public readonly data: CommandConstructor["data"];
	public cooldowns = new Collection<string, number>();
	public path?: string;
	private readonly restraints?: CommandConstructor["restraints"];
	public readonly preconditions?: CommandConstructor["preconditions"];

	constructor(data: CommandConstructor) {
		this.data = data.data;
		this.restraints = data.restraints;
		this.preconditions = data.preconditions;
	}

	/**
	 * Executes the application command's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public chatInputRun?(interaction: ChatInputCommandInteraction<"cached">): Awaitable<unknown>;

	/**
	 * Executes the message context menu's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public messageContextMenuRun?(
		interaction: MessageContextMenuCommandInteraction<"cached">
	): Awaitable<unknown>;

	/**
	 * Executes the user context menu's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public userContextMenuRun?(
		interaction: UserContextMenuCommandInteraction<"cached">
	): Awaitable<unknown>;

	/**
	 * Executes the autocomplete command's logic.
	 * @param interaction The interaction that triggered the command.
	 */
	public autocompleteRun?(interaction: AutocompleteInteraction<"cached">): Awaitable<unknown>;

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
	 * @returns {boolean}
	 */
	public isGlobal() {
		return this.restraints?.global ?? false;
	}

	public toJSON(): ApplicationCommandData[] {
		const data: ApplicationCommandData[] = [];

		const { options, description, ...contextMenuCommandData } = this.data

		if (this.supportContextMenu()) {
			data.push(
				Converters.camelCaseKeysToUnderscore({
					...contextMenuCommandData,
					dmPermission: this.restraints?.dmPermission ?? false,
					defaultMemberPermissions: new PermissionsBitField(...[this.preconditions?.requiredUserPermissions]).bitfield.toString(), 
					type: this.supportMessageContextMenu()
						? ApplicationCommandType.Message
						: ApplicationCommandType.User,
				})
			);
		}

		if (this.supportChatInput()) {
			data.push(
				Converters.camelCaseKeysToUnderscore({
					...this.data,
					dmPermission: this.restraints?.dmPermission ?? false,
					defaultMemberPermissions: new PermissionsBitField(...[this.preconditions?.requiredUserPermissions]).bitfield.toString(), 
					type: ApplicationCommandType.ChatInput,
				})
			);
		}
		return data;
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
		defaultPermissions?: boolean;
		nameLocalizations?: LocalizationMap;
		descriptionLocalizations?: LocalizationMap;
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
		whitelist?: {
			channels?: string[];
			guilds?: string[];
		};
	};
	
	restraints?: {
		dmPermission?: boolean
		global?: boolean;
		enabled?: boolean;
		cooldowns?: CooldownSettings
	};
}

export interface CooldownSettings {
	scope?: CooldownScope;
	delay?: number;
	ignore?: Snowflake[];
}
