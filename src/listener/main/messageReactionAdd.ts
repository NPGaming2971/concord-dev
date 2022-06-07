import { Client, MessageReaction, MessageType, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { Listener } from '../../structures';

export class MessageReactionAddEvent extends Listener<'messageReactionAdd'> {
	constructor(client: Client) {
		super(client, { name: 'messageReactionAdd', emitter: client });
	}

	public async run(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
		if (
			// Only works in guild channels.
			!reaction.message.inGuild() ||
			// Ignore message from threads.
			reaction.message.channel.isThread() ||
			// Ignore messages from voices.
			reaction.message.channel.isVoice() ||
			// Refuse to work with webhooks messages. Avoid duplications.
			reaction.message.webhookId ||
			// Refuse to work with system messages.
			![MessageType.Default, MessageType.Reply].includes(reaction.message.type) ||
			// Ignore self message
			!user.bot
		)
			return;
	}
}
