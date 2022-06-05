import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction } from 'discord.js';
import { Command, ResponseFormatters } from '../../structures/';
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
						type: ApplicationCommandOptionType.Channel
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

		const targetGroup = channel.fetchRegistry()?.group;

		await interaction.deferReply();

		if (!targetGroup)
			return interaction.editReply(
				ResponseFormatters.appendEmojiToString(Constants.Emojis.Failure, `This channel is not a member of any group.`)
			);

		targetGroup.channels.kick(channel);
		interaction.editReply(`Left ${targetGroup}`);
	}
}
