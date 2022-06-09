import { Client, Message, MessageType } from 'discord.js';
import { Listener } from '../../structures';
export class MessageCreateEvent extends Listener<'messageUpdate'> {
	constructor(client: Client) {
		super(client, { name: 'messageUpdate', emitter: client });
	}
	public async run(_oldMessage: Message<boolean>, newMessage: Message<boolean>) {
		if (
			// Only works in guild channels.
			!newMessage.inGuild() ||
			// Ignore message from threads.
			newMessage.channel.isThread() ||
			// Ignore messages from voices.
			newMessage.channel.isVoice() ||
			// Refuse to work with webhooks messages. Avoid duplications.
			newMessage.webhookId ||
			// Refuse to work with system messages.
			![MessageType.Default, MessageType.Reply].includes(newMessage.type) ||
			// Ignore self message
			newMessage.author.id === newMessage.client.user?.id
		)
			return;
		const registry = newMessage.client.registry.fetch(newMessage.channelId);


		if (!registry || !registry.group || !registry.webhook) return;

		registry.group.messages.edit(newMessage, { original: newMessage, attachments: [] });
	}
}
