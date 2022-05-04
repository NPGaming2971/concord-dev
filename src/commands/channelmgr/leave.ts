import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/';
import type { RegisterableChannel } from '../../typings';

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
	public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<any> {
		const channel = (interaction.options.getChannel('channel') as RegisterableChannel) ?? interaction.channel;
		const targetGroup = interaction.client.registry.fetch(interaction.channelId)?.groupId;

		await interaction.deferReply();

		if (!targetGroup) return interaction.editReply('You aint in any group.');

		const group = interaction.client.groups.cache.find((i) => i.id === targetGroup);

		group?.channels.kick(channel);
		interaction.editReply(`Left ${group?.tag}`);
	}
}
