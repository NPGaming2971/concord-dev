import { CDN } from '@discordjs/rest';
import { Attachment, EmbedBuilder, Formatters, GuildChannel, Message, MessageMentions, Sticker } from 'discord.js';
import { Routes } from 'discord.js/node_modules/discord-api-types/v10';
import { Constants } from '../../typings/constants';
import { Error } from '../../typings/enums';
import { Util } from '../../utils/utils';

export class ResponseFormatters {
	public static prepareError(errorId: keyof typeof Error, template?: { [key: string]: string }) {
		return {
			content: template ? Util.stringTemplateParser(`\`❌\` [${errorId}]\n${Error[errorId]}`, template) : `\`❌\` ${Error[errorId]}`,
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

		const icon = reference.embeds.length || reference.attachments.size ? Formatters.formatEmoji(Constants.Emojis.Image) : ''

		let replyContent = ResponseFormatters.parseMentions(reference)
			.substring(0, 64)
			.replace(/(\r\n|\n|\r)/gm, '  ').trim();

		if (reference.content.startsWith('Replying to') && reference.webhookId)
			replyContent = replyContent.substring(replyContent.indexOf('\u200B') + 1);
		return (
			`Replying to ${Formatters.hyperlink(`**\`${reference.author.username}\`**`, `<${baseURL + Routes.user(reference.author.id)}>`)}\n> ${replyContent} ${icon}\n\u200b\n${message.content}`
		);
	}
}
