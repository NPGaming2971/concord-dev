import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/';

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

		if (!registry) return interaction.editReply(`No record of my webhook found in ${channel}.`);

		if (registry.isRegistered()) {
			try {
				const webhook = await registry.fetchWebhook();

				webhook.delete().catch(() => {
					return interaction.editReply('Err');
				});
			} catch (err) {
				console.log(err);
			}
		}
		registry.delete();
		interaction.editReply('Success');

		return;
	}
}
