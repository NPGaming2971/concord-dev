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

		const cache = registry.group.messages.cache.get(message.id);

		const original = cache?.original

		if (!cache || !original) return interaction.editReply('Can not audit this message.')
		
		registry.group.messages.delete(original);

		return interaction.editReply('Success')
	}
}
