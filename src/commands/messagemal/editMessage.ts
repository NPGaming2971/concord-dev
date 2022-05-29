import { ChannelType, MessageContextMenuCommandInteraction } from 'discord.js';
import { Command } from '../../structures';

export class EditMessage extends Command {
	constructor() {
		super({
			data: {
				name: 'Edit Message',
                description: 'Edit a webhook message.'
			},
			preconditions: {
				canRunIn: [ChannelType.GuildText, ChannelType.GuildNews],
			}
		});
	}
	public override async messageContextMenuRun(interaction: MessageContextMenuCommandInteraction<'cached'>) {
        await interaction.deferReply()
		//@ts-expect-error
		const message = interaction.targetMessage;

		if (!interaction.channel?.isRegisterable()) return

		const registry = interaction.channel.fetchRegistry();
		if (!registry?.group || !registry.isRegistered()) return interaction.editReply('Can not audit this message.')
        return
	} 
}