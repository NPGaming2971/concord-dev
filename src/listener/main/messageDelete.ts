import { Client, Message, MessageType } from 'discord.js';
import { Listener } from '../../structures';
export class MessageCreateEvent extends Listener<'messageDelete'> {
	constructor(client: Client) {
		super(client, { name: 'messageDelete', emitter: client });
	}
	public async run(message: Message) {
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

		if (!registry || !registry.group || !registry.webhook) return;

		registry.group.messages.delete(message);
	}
}
