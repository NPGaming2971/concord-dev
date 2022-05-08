import { EmbedBuilder } from '@discordjs/builders';
import { Attachment, Client, Message, MessageType, Sticker, WebhookClient } from 'discord.js';
import { Listener } from '../../structures';
import { Util } from '../../utils/utils';

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
			// Ignore messages from voices
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

		// Message components
		const embeds = message.embeds.map((embed) => new EmbedBuilder(embed.data));
		let [passed, video] = message.attachments.partition((att) => !att.contentType?.startsWith('video/'));

		const images = passed.map((att) => {
			return renderAttachment(att);
		});

		const stickers = message.stickers.map((sticker) => renderSticker(sticker));

		const attachments = video.toJSON();

		//Preparing responses
		const attachmentsToSend = embeds.concat(images, stickers);

		//Responding
		new WebhookClient({ url: registry.webhook }).send({
			username: message.author.username,
			avatarURL: message.author.displayAvatarURL({size: 4096}),
			content: message.content,
			files: attachments,
			embeds: attachmentsToSend
		});
	}
}

function renderAttachment(att: Attachment) {
	const icon = 'https://cdn.discordapp.com/emojis/955764107997491261.webp?size=40&quality=lossless';
	const embed = new EmbedBuilder();
	if (att.contentType?.startsWith('image')) {
		return embed.setImage(att.url).setFooter({ text: `Image: ${att.name}` });
	} else {
		return embed
			.setTitle(att.name ?? 'Untitled')
			.setURL(att.url)
			.setDescription(Util.sizeOf(att.size))
			.setThumbnail(icon);
	}
}

function renderSticker(sticker: Sticker) {
	return new EmbedBuilder().setImage(sticker.url).setFooter({ text: `Sticker: ${sticker.name}` });
}
