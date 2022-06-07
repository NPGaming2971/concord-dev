import { CachedManager, Message, WebhookMessageOptions } from 'discord.js';
import { merge } from 'lodash';
import { Group, ResponseFormatters } from '../structures';
import { GroupMessage } from '../structures/general/GroupMessage';
import type { ChannelRegistryResolvable } from './ChannelRegistryManager';

export interface GroupMessageOptions extends WebhookMessageOptions {
	exclude?: ChannelRegistryResolvable[];
	original?: Message;
}

export type GroupEditMessageOptions = Pick<
	GroupMessageOptions,
	'content' | 'embeds' | 'files' | 'allowedMentions' | 'components' | 'attachments' | 'threadId' | 'original'
>;

export interface GroupMessageManager {
	group: Group;
}
type GroupMessageResolvable = string | GroupMessage | Message;
export class GroupMessageManager extends CachedManager<string, GroupMessage, GroupMessageResolvable> {
	constructor(group: Group) {
		super(group.client, GroupMessage);
		this.group = group;
	}

	/**
	 *  Send a message to the group.
	 * 	Note that all other options except `exclude` will override payload generated from `original` if exists.
	 */
	public async create(options: GroupMessageOptions) {
		let { original, exclude = [], ...payload } = options;

		const message = original ? await ResponseFormatters.renderMessage(original) : {};

		return this.group.channels.cache
			.filter((registry) => {
				return !options.exclude!.map((i) => this.client.registry.resolveId(i)).includes(registry.channelId);
			})
			.map((i) => i.send(merge(message, payload)));
	}

	public edit(_message: GroupMessageResolvable) {}

	public delete(_message: GroupMessageResolvable) {}

	public getReferenceOf(_message: GroupMessageResolvable) {}

	public getParentOf(_message: GroupMessageResolvable) {}

	// Overload for resolve()
	public override resolve(resolvable: GroupMessage): GroupMessage;
	public override resolve(resolvable: GroupMessageResolvable): GroupMessage | null;
	public override resolve(message: any): GroupMessage | null {
		if (message instanceof Message) {
			return super.resolve(message);
		}
		return super.resolve(message);
	}

	// Overload for resolveId()
	public override resolveId(resolvable: string | GroupMessage): string;
	public override resolveId(resolvable: GroupMessageResolvable): string | null;
	public override resolveId(message: any): string | null {
		if (message instanceof Message) {
			return super.resolveId(message);
		}
		return super.resolveId(message);
	}

	// public getRefOf(message: GroupMessageResolvable) {
	// 	const id = this.resolveId(message);
	// 	return this.cache.filter((msg) => {
	// 		const [, parentId] = msg.parentId;
	// 		return id === parentId;
	// 	});
	// }
	// public getParentOf(target: GroupMessageResolvable) {
	// 	const message = this.resolve(target);
	// 	if (!message) return undefined;
	// 	const [, parentId] = message.parentId;
	// 	if (!parentId) return undefined;
	// 	return this.cache.get(parentId);
	// }
	// public async edit(message: Message) {
	// 	const coll = this.getRefOf(message);
	// 	if (!coll.size) return;
	// 	const embeds = message.embeds.map((embed) => new EmbedBuilder(embed.data));
	// 	let [passed, video] = message.attachments.partition((att) => !att.contentType?.startsWith('video/'));
	// 	const images = passed.map((att) => {
	// 		return renderAttachment(att);
	// 	});
	// 	const attachments = video.toJSON();
	// 	const attachmentsToSend = embeds.concat(images);
	// 	coll.map(async (msg) => {
	// 		msg.registry.editMessage(msg.id, {
	// 			embeds: attachmentsToSend,
	// 			attachments: [],
	// 			files: attachments,
	// 			content: message.reference?.messageId ? parseReply(message, await message.fetchReference()) : parseMentions(message),
	// 			allowedMentions: {
	// 				parse: ['users']
	// 			}
	// 		});
	// 	});
	// }
	// public _addMultiple(...messages: APIGroupMessage[]) {
	// 	for (const message of messages) {
	// 		this._add(message, true, { id: message.message.id, extras: [message.group] });
	// 	}
	// }
	// public delete(target: GroupMessageResolvable) {
	// 	const coll = this.getRefOf(target);
	// 	if (!coll.size) return;
	// 	coll.map((msg) => msg.registry.deleteMessage(msg.id));
	// }
	// 		.map(async (channel) => {
	// 			return fromAsync<APIGroupMessage, DiscordAPIError>(
	// 				channel.send(payload).then((msg) => ({
	// 					url: channel.webhook!,
	// 					message: msg,
	// 					parentId: parentData,
	// 					group: this.group,
	// 					registry: channel
	// 				}))
	// 			);
	// 		});
	// 	const results = await Promise.all(promises);
	// 	this._addMultiple(...results.filter((i) => isOk(i)).map((result) => result.value!));
	// 	return results;
	// }
}
