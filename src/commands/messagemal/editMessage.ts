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

		//const message = interaction.targetMessage;

		if (!interaction.channel?.isRegisterable()) return

		const registry = interaction.channel.fetchRegistry();
		if (!registry?.group || !registry.isRegistered()) return interaction.editReply('Can not audit this message.')

		//const parent = registry.group.messages.getParentOf(message)!

		console.log(parent)

		//console.log(registry.group.messages.getRefOf(parent))

        return
	} 
}