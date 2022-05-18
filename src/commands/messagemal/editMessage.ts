import type { MessageContextMenuCommandInteraction } from 'discord.js';
import { Command } from '../../structures';

export class EditMessage extends Command {
	constructor() {
		super({
			data: {
				name: 'Edit Message',
                description: 'Edit a webhook message.'
			}
		});
	}
	public override async messageContextMenuRun(interaction: MessageContextMenuCommandInteraction<'cached'>) {
        await interaction.deferReply()
		const message = interaction.targetMessage;

		const registry = interaction.client.registry.fetch(message.channelId);
        if (!registry?.group || !registry.isRegistered()) return interaction.editReply('Can not audit this message.')
        return
	}
}