import { type Result, fromAsync, isOk } from '@sapphire/result';
import { CachedManager, DiscordAPIError, EmbedBuilder, Message } from 'discord.js';
import { Group, ResponseFormatters } from '../structures';
import { GroupMessage } from '../structures/general/GroupMessage';
import type { APIGroupMessage } from '../typings';

export interface GroupMessageManager {
	group: Group;
}
type GroupMessageResolvable = string | GroupMessage | Message;
const { renderAttachment, formatSticker, parseMentions, parseReply } = ResponseFormatters;
export class GroupMessageManager extends CachedManager<string, GroupMessage, GroupMessageResolvable> {
	constructor(group: Group) {
		super(group.client, GroupMessage);

		this.group = group;
	}

	public override resolveId(message: GroupMessageResolvable) {
		if (message instanceof Message) {
			return super.resolveId(message.id);
		}
		return super.resolveId(message) as string;
	}

	public getRefOf(message: GroupMessageResolvable) {
		const id = this.resolveId(message);
		return this.cache.filter((msg) => {
			const [, parentId] = msg.parentId;

			return id === parentId;
		});
	}
	public getParentOf(target: GroupMessageResolvable) {
		const message = this.resolve(target);
		if (!message) return undefined;

		const [, parentId] = message.parentId;
		return this.cache.get(parentId);
	}
	
	public async edit(message: Message) {
		const coll = this.getRefOf(message);

		if (!coll.size) return

		const embeds = message.embeds.map((embed) => new EmbedBuilder(embed.data));
		let [passed, video] = message.attachments.partition((att) => !att.contentType?.startsWith('video/'));

		const images = passed.map((att) => {
			return renderAttachment(att);
		});
		const attachments = video.toJSON();

		const attachmentsToSend = embeds.concat(images);

		coll.map(async (msg) => {
			msg.registry.editMessage(msg.id, {
				embeds: attachmentsToSend,
				attachments: [],
				files: attachments,
				content: message.reference?.messageId ? parseReply(message, await message.fetchReference()) : parseMentions(message),
				allowedMentions: {
					parse: ['users']
				}
			});
		});
	}

	public _addMultiple(...messages: APIGroupMessage[]) {
		for (const message of messages) {
			this._add(message, true, { id: message.message.id, extras: [message.group] });
		}
	}
	
	public delete(target: GroupMessageResolvable) {
		const coll = this.getRefOf(target);

		if (!coll.size) return

		coll.map(msg => msg.registry.deleteMessage(msg.id))
	}

	public async create(message: Message): Promise<Result<APIGroupMessage, unknown>[]> {
		// Message components
		const embeds = message.embeds.map((embed) => new EmbedBuilder(embed.data));
		let [passed, video] = message.attachments.partition((att) => !att.contentType?.startsWith('video/'));

		const images = passed.map((att) => {
			return renderAttachment(att);
		});

		const stickers = message.stickers.map((sticker) => formatSticker(sticker));

		const attachments = video.toJSON();

		//Preparing responses
		const attachmentsToSend = embeds.concat(images, stickers);

		const promises = this.group.channels.cache.map(async (channel) => {
			return fromAsync<APIGroupMessage, DiscordAPIError>(
				channel
					.send({
						embeds: attachmentsToSend,
						files: attachments,
						username: message.author.tag,
						avatarURL: message.author.displayAvatarURL(),
						allowedMentions: {
							parse: ['users']
						},
						content: message.reference?.messageId ? parseReply(message, await message.fetchReference()) : parseMentions(message)
					})
					.then((msg) => ({
						url: channel.webhook!,
						message: msg,
						parentId: [message.channelId, message.id],
						group: this.group,
						registry: channel
					}))
			);
		});

		const results = await Promise.all(promises);

		this._addMultiple(...results.filter((i) => isOk(i)).map((result) => result.value!));
		return results;
	}
}
