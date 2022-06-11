import { ChannelType, Client, Formatters, Interaction, MessagePayload, PermissionResolvable } from 'discord.js';
import { Command, Error, Listener, ResponseFormatters } from '../structures/';
import { Constants } from '../typings/constants';
import { Converters } from '../utils/Converters';
import { InteractionResponseType, Routes } from 'discord-api-types/v10';
export class InteractionCreateEvent extends Listener<'interactionCreate'> {
	constructor(client: Client) {
		super(client, { name: 'interactionCreate' });
	}
	public async run(interaction: Interaction) {
		if (!interaction.inCachedGuild()) {
			interaction.client.rest.post(Routes.interactionCallback(interaction.id, interaction.token), {
				body: {
					type: InteractionResponseType.ChannelMessageWithSource,
					data: new MessagePayload(interaction, { content: 'Location not allowed or missing bot scope upon inviting.' }),
					auth: false
				}
			});
			return;
		}

		if (interaction.isCommand()) {
			try {
				const command = interaction.client.commands.cache.get(interaction.commandName);
				if (!command) throw new Error('NON_EXISTENT_RESOURCE', Command.name, interaction.commandName, 'Concord.');

				if (command.preconditions) {
					this.handlePrecondtions(command, interaction);
				}
				if (interaction.isChatInputCommand()) {
					if (command.supportChatInput()) {
						await command.chatInputRun(interaction);
					}
				}
				if (interaction.isContextMenuCommand()) {
					if (!command.supportContextMenu()) return;

					if (interaction.isMessageContextMenuCommand() && command.supportMessageContextMenu())
						await command.messageContextMenuRun(interaction);

					if (interaction.isUserContextMenuCommand() && command.supportUserContextMenu()) await command.userContextMenuRun(interaction);
				}
			} catch (err: unknown) {
				console.dir(err, { depth: null });
				interaction[interaction.replied || interaction.deferred ? 'editReply' : 'reply'](ResponseFormatters.prepareError(err as Error));
			}
		} else if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.cache.get(interaction.commandName);
			if (!command) return interaction.respond([{ name: 'Unknown command.', value: 'unknown' }]);

			if (command.supportAutocomplete()) {
				await command.autocompleteRun(interaction);
			}
		}
	}

	public handlePrecondtions(command: Command, interaction: Interaction<'cached'>) {
		if (!command.preconditions) return;

		const { canRunIn, elevatedPermissions, requiredUserPermissions, requiredClientPermissions, whitelist } = command.preconditions;

		const formatPermissions = (permissions: PermissionResolvable[]) =>
			permissions.map((i) => Formatters.inlineCode(Converters.splitPascalCase(i.toString())!)).join(', ');
		const formatChannelTypes = (channelTypes: ChannelType[]) =>
			channelTypes.map((i) => Formatters.inlineCode(Converters.splitPascalCase(ChannelType[i])!)).join(', ');

		if (elevatedPermissions) {
			if (!Constants.Administrators.includes(interaction.user.id)) throw new Error('ELEVATED_PERMISSION_REQUIRED');
		}

		if (whitelist) {
			const { channels, guilds } = whitelist;

			if (guilds && !guilds?.includes(interaction.guildId)) throw new Error('DISALLOWED_LOCATION', 'guild');

			if (channels && !channels?.includes(interaction.channelId!)) throw new Error('DISALLOWED_LOCATION', 'channel');
		}

		if (requiredUserPermissions) {
			if (!interaction.memberPermissions.has(requiredUserPermissions))
				throw new Error(`MISSING_USER_PERMISSIONS`, formatPermissions(requiredUserPermissions));
		}

		if (requiredClientPermissions) {
			if (!interaction.guild.members.me?.permissions.has(requiredClientPermissions))
				throw new Error(`MISSING_CLIENT_PERMISSIONS`, formatPermissions(requiredClientPermissions));
		}

		if (canRunIn) {
			if (!canRunIn.includes(interaction.channel!.type)) {
				throw new Error('CHANNEL_TYPE_PRECONDITIONS_FAILED', formatChannelTypes(canRunIn));
			}
		}
	}
}
