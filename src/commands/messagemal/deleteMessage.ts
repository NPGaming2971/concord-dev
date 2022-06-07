import { ChannelType, MessageContextMenuCommandInteraction } from 'discord.js';
import { Command } from '../../structures';

export class EditMessage extends Command {
	constructor() {
		super({
			data: {
				name: 'Delete Message',
				description: 'Delete a webhook message.'
			},
			preconditions: {
				canRunIn: [ChannelType.GuildText, ChannelType.GuildNews]
			}
		});
	}
	public override async messageContextMenuRun(interaction: MessageContextMenuCommandInteraction<'cached'>) {
		await interaction.deferReply({ ephemeral: true });
		const message = interaction.targetMessage;

		if (!message.webhookId) return interaction.editReply('This is not a webhook message.');

		if (!interaction.channel?.isRegisterable()) return

		const registry = interaction.channel.fetchRegistry();

		if (!registry?.group || !registry.isRegistered()) return interaction.editReply('Can not audit this message.');

		//const parent = registry.group.messages.getParentOf(message)!;
		return
		//return registry.group.messages.delete(parent);
	}
}
