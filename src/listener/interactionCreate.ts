import { ChannelType, Client, Formatters, Interaction, MessagePayload, PermissionResolvable } from 'discord.js';
import { Error, Listener, ResponseFormatters } from '../structures/';
import { Constants } from '../typings/constants';
import { Converters } from '../utils/Converters';
import { fromAsync } from '@sapphire/result';
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
			const command = interaction.client.commands.cache.get(interaction.commandName);
			if (!command) return interaction.reply('Unknown command.');

			if (command.preconditions) {
				const { canRunIn, elevatedPermissions, requiredUserPermissions, requiredClientPermissions, whitelist } = command.preconditions;

				const { prepareError } = ResponseFormatters;
				const formatPermissions = (permissions: PermissionResolvable[]) =>
					permissions.map((i) => Formatters.inlineCode(Converters.splitPascalCase(i.toString())!)).join(', ');
				const formatChannelTypes = (channelTypes: ChannelType[]) =>
					channelTypes.map((i) => Formatters.inlineCode(Converters.splitPascalCase(ChannelType[i])!)).join(', ');

				if (elevatedPermissions) {
					if (!Constants.Administrators.includes(interaction.user.id))
						return interaction.reply(prepareError(new Error('ELEVATED_PERMISSION_REQUIRED')));
				}

				if (whitelist) {
					const { channels, guilds } = whitelist;

					if (guilds && !guilds?.includes(interaction.guildId))
						return interaction.reply(prepareError(new Error('DISALLOWED_LOCATION', 'guild')));

					if (channels && !channels?.includes(interaction.channelId))
						return interaction.reply(prepareError(new Error('DISALLOWED_LOCATION', 'channel')));
				}

				if (requiredUserPermissions) {
					if (!interaction.memberPermissions.has(requiredUserPermissions))
						return interaction.reply(prepareError(new Error(`MISSING_USER_PERMISSIONS`, formatPermissions(requiredUserPermissions))));
				}

				if (requiredClientPermissions) {
					if (!interaction.guild.members.me?.permissions.has(requiredClientPermissions))
						return interaction.reply(prepareError(new Error(`MISSING_CLIENT_PERMISSIONS`, formatPermissions(requiredClientPermissions))));
				}

				if (canRunIn) {
					if (!canRunIn.includes(interaction.channel!.type)) {
						return interaction.reply(prepareError(new Error('CHANNEL_TYPE_PRECONDITIONS_FAILED', formatChannelTypes(canRunIn))));
					}
				}
			}
			if (interaction.isChatInputCommand()) {
				if (command.supportChatInput()) {
					fromAsync(command.chatInputRun.bind(command, interaction));
				}
			}
			if (interaction.isContextMenuCommand()) {
				if (!command.supportContextMenu()) return;

				if (interaction.isMessageContextMenuCommand() && command.supportMessageContextMenu())
					fromAsync(command.messageContextMenuRun.bind(command, interaction)).catch(console.error);

				if (interaction.isUserContextMenuCommand() && command.supportUserContextMenu())
					fromAsync(command.userContextMenuRun.bind(command, interaction)).catch(console.error);
			}
		} else if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.cache.get(interaction.commandName);
			if (!command) return interaction.respond([{ name: 'Unknown command.', value: 'unknown' }]);

			if (command.supportAutocomplete()) {
				fromAsync(command.autocompleteRun.bind(command, interaction)).catch(console.error);
			}
		}
	}
}
