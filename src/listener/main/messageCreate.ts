import { Client, Message, MessageType } from 'discord.js';
import { Listener } from '../../structures';
import { ConditionHandler } from '../../utils/ConditionHandler';
export class MessageCreateEvent extends Listener<'messageCreate'> {
	constructor(client: Client) {
		super(client, { name: 'messageCreate', emitter: client });
	}
	public async run(message: Message<boolean>) {
		if (
			// Only works in guild channels.
			!message.inGuild() ||
			// Only works in registerable channels.
			!message.channel.isRegisterable() ||
			// Refuse to work with webhooks messages. Avoid duplications.
			message.webhookId ||
			// Refuse to work with system messages.
			![MessageType.Default, MessageType.Reply].includes(message.type) ||
			// Ignore self message
			message.author.bot
		)
			return;

		const registry = message.channel.fetchRegistry();

		if (!registry || !registry.group || !registry.isRegistered()) return;

		//TODO: handle message exceeding api limit (attachments, content)

		if (message.content.length > 2000) {
			ConditionHandler.handleExceedingLength(message, registry.group, registry);
			return;
		}
		//Responding
		registry.group?.send({ exclude: [registry], original: message });
	}
}
