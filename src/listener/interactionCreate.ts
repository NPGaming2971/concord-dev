import { ChannelType, Client, Formatters, Interaction, PermissionResolvable } from 'discord.js';
import { Listener, ResponseFormatters } from '../structures/';
import { Converters } from '../utils/converters';
import { Util } from '../utils/utils';

export class InteractionCreateEvent extends Listener<'interactionCreate'> {
	constructor(client: Client) {
		super(client, { name: 'interactionCreate' });
	}
	public async run(interaction: Interaction) {
		if (!interaction.inCachedGuild()) return;

		if (interaction.isCommand()) {
			const command = interaction.client.commands.cache.get(interaction.commandName);
			if (!command) return interaction.reply('Unknown command.');

			if (command.preconditions) {
				const { canRunIn, elevatedPermissions, requiredClientPermissions, whitelist } = command.preconditions;

				const { prepareError } = ResponseFormatters;
				const formatPermissions = (permissions: PermissionResolvable[]) =>
					permissions.map((i) => Formatters.inlineCode(Converters.splitPascalCase(i.toString())!)).join(', ');
				const formatChannelTypes = (channelTypes: ChannelType[]) =>
					channelTypes.map((i) => Formatters.inlineCode(Converters.splitPascalCase(ChannelType[i])!)).join(', ');

				if (elevatedPermissions) {
					if (!['792645340632317992'].includes(interaction.user.id)) return interaction.reply(prepareError('ELEVATED_PERMISSION_REQUIRED'));
				}

				if (whitelist) {
					const { channels, guilds } = whitelist;

					if (guilds && !guilds?.includes(interaction.guildId)) return interaction.reply(prepareError('DISALLOWED_LOCATION'));

					if (channels && !channels?.includes(interaction.channelId)) return interaction.reply(prepareError('DISALLOWED_LOCATION'));
				}

				if (requiredClientPermissions) {
					if (!interaction.guild.me?.permissions.has(requiredClientPermissions))
						return interaction.reply(
							prepareError(`MISSING_CLIENT_PERMISSIONS`, {
								permissions: formatPermissions(requiredClientPermissions)
							})
						);
				}

				if (canRunIn) {
					if (!canRunIn.includes(interaction.channel!.type)) {
						return interaction.reply(
							prepareError('CHANNEL_TYPE_PRECONDITIONS_FAILED', {
								channelTypes: formatChannelTypes(canRunIn)
							})
						);
					}
				}
			}

			if (interaction.isChatInputCommand()) {
				if (command.supportChatInput()) {
					Util.fromAsync(command.chatInputRun.bind(command, interaction));
				}
			}
			if (interaction.isContextMenuCommand()) {
				if (!command.supportContextMenu()) return;

				if (interaction.isMessageContextMenuCommand() && command.supportMessageContextMenu())
					Util.fromAsync(command.messageContextMenuRun.bind(command, interaction));

				if (interaction.isUserContextMenuCommand() && command.supportUserContextMenu())
					Util.fromAsync(command.userContextMenuRun.bind(command, interaction));
			}
		} else if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.cache.get(interaction.commandName);
			if (!command) return interaction.respond([{ name: 'Unknown command.', value: 'unknown' }]);

			if (command.supportAutocomplete()) {
				Util.fromAsync(command.autocompleteRun.bind(command, interaction));
			}
		}
	}
}
