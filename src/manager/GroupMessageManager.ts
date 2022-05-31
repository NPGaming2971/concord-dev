import { type Result, fromAsync, isOk } from '@sapphire/result';
import { CachedManager, DiscordAPIError, EmbedBuilder, Message, WebhookMessageOptions } from 'discord.js';
import { ChannelRegistry, Group, ResponseFormatters } from '../structures';
import { GroupMessage } from '../structures/general/GroupMessage';
import type { APIGroupMessage } from '../typings';

export type GroupMessageSendOptions = {
	exclude?: ChannelRegistry[];
};

export interface GroupMessageManager {
	group: Group;
}
type GroupMessageResolvable = string | GroupMessage | Message;
const { renderAttachment, parseMentions, parseReply } = ResponseFormatters;
export class GroupMessageManager extends CachedManager<string, GroupMessage, GroupMessageResolvable> {
	constructor(group: Group) {
		super(group.client, GroupMessage);

		this.group = group;
	}

	public override resolveId(message: GroupMessageResolvable) {
		if (message instanceof Message) {
			return super.resolveId(message.id);
		}
		return super.resolveId(message);
	}

	public override resolve(message: GroupMessage): GroupMessage
	public override resolve(message: GroupMessageResolvable): GroupMessage | null
	public override resolve(message: GroupMessage | GroupMessageResolvable) {
		if (message instanceof Message) {
			return super.resolve(message);
		}
		return super.resolve(message);
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

		if (!parentId) return undefined;

		return this.cache.get(parentId);
	}

	public async edit(message: Message) {
		const coll = this.getRefOf(message);

		if (!coll.size) return;

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
			//@ts-expect-error
			this._add(message, true, { id: message.message.id, extras: [message.group] });
		}
	}

	public delete(target: GroupMessageResolvable) {
		const coll = this.getRefOf(target);

		if (!coll.size) return;

		coll.map((msg) => msg.registry.deleteMessage(msg.id));
	}

	public async create(
		message: Message | WebhookMessageOptions,
		options: GroupMessageSendOptions = { exclude: [] }
	): Promise<Result<APIGroupMessage, unknown>[]> {
		let payload: WebhookMessageOptions;
		let parentData: [string, string] | [null, null];
		const getMessageParentData = (message: Message) => [message.channelId, message.id];

		if (message instanceof Message) {
			payload = await ResponseFormatters.renderMessage(message);
			parentData = getMessageParentData(message) as [string, string];
		} else {
			payload = message;
			parentData = [null, null];
		}
		const promises = this.group.channels.cache
			.filter((i) => !options.exclude?.map((registry) => registry.channelId).includes(i.channelId))
			.map(async (channel) => {
				return fromAsync<APIGroupMessage, DiscordAPIError>(
					channel.send(payload).then((msg) => ({
						url: channel.webhook!,
						message: msg,
						parentId: parentData,
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
