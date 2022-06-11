import { fromAsync, isOk } from '@sapphire/result';
import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction, DiscordAPIError } from 'discord.js';
import { ChannelRegistry, Command, ResponseFormatters } from '../../structures/';
import { Constants } from '../../typings/constants';
import { Util } from '../../utils';
const { prepareError, appendEmojiToString } = ResponseFormatters;

export class UnregisterCommand extends Command {
	constructor() {
		super({
			data: {
				name: 'unregister',
				description: 'Register a channel to be ready to connect to Concord group.',
				options: [
					{
						name: 'channel',
						description: 'The channel to unregister.',
						type: ApplicationCommandOptionType.Channel,
						channelTypes: [ChannelType.GuildText, ChannelType.GuildNews]
					}
				]
			},
			preconditions: {
				canRunIn: [ChannelType.GuildText, ChannelType.GuildNews],
				requiredClientPermissions: ['ManageWebhooks'],
				requiredUserPermissions: ['ManageChannels']
			}
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		const channel = interaction.options.getChannel('channel')! ?? interaction.channel;

		if (!channel.isRegisterable()) return;

		await interaction.deferReply();
		const registry = channel.fetchRegistry();

		if (!registry) return interaction.editReply(appendEmojiToString(Constants.Emojis.Failure, `This channel wasn't registered before`));

		const options = {
			content: appendEmojiToString(
				Constants.Emojis.Warning,
				`Are you sure you want to unregister this channel?\n${registry.groupId ? `This will also make you leave ${registry.group}!` : ''}`
			)
		};
		const defaultOptions = {
			embeds: [],
			components: []
		};
		Util.startPrompt(
			interaction,
			options,
			async (i) => {
				const result = await fromAsync<any, DiscordAPIError>(this.unregister(registry));

				console.log(result)
				if (!isOk(result)) {
					return i.update(prepareError(result.error));
				}
				
				return i.update({
					content: appendEmojiToString(Constants.Emojis.Success, `Successfully unregistered this channel.`),
					...defaultOptions
				});
			},
			(i) => {
				i.update({ content: appendEmojiToString(Constants.Emojis.Success, 'Action cancelled.'), ...defaultOptions });
			}
		);

		return;
	}

	public async unregister(registry: ChannelRegistry) {

		if (registry.isRegistered()) {
			const webhook = await registry.fetchWebhook();

			await webhook.delete().catch((err) => err);
		}

		return registry.delete();
	}
}
