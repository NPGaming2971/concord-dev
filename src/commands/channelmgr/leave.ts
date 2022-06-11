import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction } from 'discord.js';
import { Command, Error, ResponseFormatters } from '../../structures/';
import { Constants } from '../../typings/constants';

export class LeaveCommand extends Command {
	constructor() {
		super({
			data: {
				name: 'leave',
				description: 'Leave the current group.',
				options: [
					{
						name: 'channel',
						description: 'The channel to execute this command in. Defaults to this channel.',
						type: ApplicationCommandOptionType.Channel,
						channelTypes: [ChannelType.GuildNews, ChannelType.GuildText]
					}
				]
			},
			preconditions: {
				canRunIn: [ChannelType.GuildText, ChannelType.GuildNews],
				requiredUserPermissions: ['ManageChannels']
			}
		});
	}
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>): Promise<any> {
		const channel = interaction.options.getChannel('channel')! ?? interaction.channel;

		if (!channel.isRegisterable()) return;

		const registry = channel.fetchRegistry()
		const targetGroup = registry?.group

		await interaction.deferReply();

		if (!targetGroup)
			throw new Error('NON_EXISTENT_RESOURCE', 'Property', 'groupId', `registry '${registry?.channelId}'`)

		targetGroup.channels.kick(channel);
		interaction.editReply(`Left ${targetGroup}`);
	}
}
