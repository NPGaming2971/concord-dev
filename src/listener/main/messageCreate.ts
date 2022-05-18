import { Client, Message, MessageType } from 'discord.js';
import { Listener } from '../../structures';
export class MessageCreateEvent extends Listener<'messageCreate'> {
	constructor(client: Client) {
		super(client, { name: 'messageCreate', emitter: client });
	}
	public async run(message: Message<boolean>) {
		if (
			// Only works in guild channels.
			!message.inGuild() ||
			// Ignore message from threads.
			message.channel.isThread() ||
			// Ignore messages from voices.
			message.channel.isVoice() ||
			// Refuse to work with webhooks messages. Avoid duplications.
			message.webhookId ||
			// Refuse to work with system messages.
			![MessageType.Default, MessageType.Reply].includes(message.type) ||
			// Ignore self message
			message.author.id === message.client.user?.id
		)
			return;
		const registry = message.client.registry.fetch(message.channelId);

		if (!registry || !registry.groupId || !registry.webhook) return;
		
		//TODO: handle message exceeding api limit (attachments, content)
		/*
		if (message.content.length > 100) {
			const buttonsRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
				new ButtonBuilder().setLabel('Send as a file').setStyle(ButtonStyle.Primary).setCustomId('concord:message/sendAsFile'),
				new ButtonBuilder()
					.setLabel('Cut down content to 2000 characters')
					.setStyle(ButtonStyle.Danger)
					.setCustomId('concord:message/cutDown'),
				new ButtonBuilder().setLabel('Do nothing (15s)').setStyle(ButtonStyle.Danger).setCustomId('concord:message/cancel')
			);

			const msg = await message.reply({
				content: 'Your message exceeded the 2000 characters limit.\nPlease choose a method to proceed.',
				components: [buttonsRow]
			});
			try {
				const collected = await msg.awaitMessageComponent({
					filter: Constants.BaseFilter(msg),
					componentType: ComponentType.Button,
					idle: 15000
				});
				if (collected.customId === 'concord:message/cancel') {
					
				}
			} catch (e) {
				
			}
		}
		*/

		//Responding
		registry.group?.send(message);
	}
}
