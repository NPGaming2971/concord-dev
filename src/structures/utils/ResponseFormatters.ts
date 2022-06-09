import { CDN } from '@discordjs/rest';
import { Attachment, EmbedBuilder, Formatters, GuildChannel, Message, MessageMentions, Sticker, WebhookMessageOptions } from 'discord.js';
import { Routes } from 'discord.js';
import { Constants } from '../../typings/constants';
import { Util } from '../../utils/';
import type { GroupRequest } from '../general/GroupRequest';

export class ResponseFormatters {
	public static prepareError(error: Error) {
		return {
			content: `\`❌\` **${error.name}**\n${error.message}`,
			ephemeral: true
		};
	}
	public static renderAttachment(att: Attachment) {
		const icon = new CDN().emoji(Constants.Emojis.Attachment, 'png');
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

	public static renderRequest(request: GroupRequest) {
		return new EmbedBuilder().setFields(
			[{
				name: 'Channel',
				value: Formatters.inlineCode(`#${request.channel.name}`),
				inline: true
			}, {
				name: 'Guild',
				value: request.channel.guild.name,
				inline: true
			}, {
				name: 'Type',
				value: request.type
			}, {
				name: 'Message',
				value: request.message ?? 'No message provided.'
			}]	
		).setTitle('Group Request')
	}

	public static formatSticker(sticker: Sticker) {
		return new EmbedBuilder().setImage(sticker.url).setFooter({ text: `Sticker: ${sticker.name}` });
	}

	public static parseMentions(message: Message) {
		if (!message.inGuild() || !message.content.length) return message.content;
		const { ChannelsPattern, RolesPattern, UsersPattern } = MessageMentions;

		return message.content
			.replaceAll(/></g, '>⁠<')
			.replace(UsersPattern, (input) => {
				const id = input.replace(/<|!|>|@/g, '');
				const user = message.client.users.cache.get(id);

				return user ? Formatters.inlineCode(`@` + user.username) : Formatters.inlineCode('@unknown-user');
			})
			.replace(ChannelsPattern, (input) => {
				const mentionedChannel = message.client.channels.resolve(input.replace(/<|#|>/g, '')) as GuildChannel;
				return mentionedChannel ? Formatters.inlineCode(`#` + mentionedChannel.name) : Formatters.inlineCode('#unknown-channel');
			})
			.replace(RolesPattern, (input) => {
				const role = message.guild.roles.resolve(input.replace(/<|@|>|&/g, ''));
				return role ? Formatters.inlineCode(`@` + role.name) : Formatters.inlineCode('@unknown-role');
			});
	}

	public static parseReply(message: Message, reference: Message) {
		const baseURL = 'https://discord.com';

		const icon = (reference.embeds.length || reference.attachments.size) ? Formatters.formatEmoji(Constants.Emojis.Image) : ''

		

		let replyContent = ResponseFormatters.parseMentions(reference)
			.replace(/(\r\n|\n|\r)/gm, '  ').trim();

		if (reference.content.startsWith('Replying to') && reference.webhookId)
			replyContent = replyContent.substring(replyContent.indexOf('\u200B') + 1);
		return (
			`Replying to ${Formatters.hyperlink(`**\`${reference.author.username}\`**`, `<${baseURL + Routes.user(reference.author.id)}>`)}\n> ${replyContent.substring(0, 64)}${replyContent.length > 64 ? '...' : ''} ${icon}\n\u200b\n${message.content}`
		);
	}

	static appendEmojiToString(emoji: string, string: string) {
		return `\`${emoji}\` ${string}`
	}

	static async renderMessage(message: Message): Promise<WebhookMessageOptions> {
		const { renderAttachment, formatSticker, parseMentions, parseReply } = ResponseFormatters;
		const embeds = message.embeds.map((embed) => new EmbedBuilder(embed.data));
		let [passed, video] = message.attachments.partition((att) => !att.contentType?.startsWith('video/'));

		const images = passed.map((att) => {
			return  renderAttachment(att);
		});

		const stickers = message.stickers.map((sticker) => formatSticker(sticker));

		const attachments = video.toJSON();

		//Preparing responses
		const attachmentsToSend = embeds.concat(images, stickers);

		return {
			embeds: attachmentsToSend,
			files: attachments,
			username: message.author.tag,
			avatarURL: message.author.displayAvatarURL(),
			allowedMentions: {
				parse: ['users']
			},
			content: message.reference?.messageId ? parseReply(message, await message.fetchReference()) : parseMentions(message)
		};
	}
}
