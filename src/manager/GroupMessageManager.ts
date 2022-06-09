import { CachedManager, Message, WebhookMessageOptions } from 'discord.js';
import { merge } from 'lodash';
import { Group, ResponseFormatters } from '../structures';
import { GroupMessage } from '../structures/general/GroupMessage';
import type { APIGroupMessage } from '../typings';
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

		const message = original ? await ResponseFormatters.renderMessage(original) : null;

		const results = this.group.channels.cache
			.filter((registry) => {
				return !options.exclude!.map((i) => this.client.registry.resolveId(i)).includes(registry.channelId);
			})
			.map((channel) =>
				channel.send(merge(message, payload)).then((msg) => ({
					original: original ?? null,
					message: msg,
					registry: channel
				}))
			);

		const result = await Promise.all(results);
		this._addMultiple(...result);

		return result;
	}

	public async edit(target: GroupMessageResolvable, options: GroupEditMessageOptions) {
		const collection = this.getReferenceOf(target);
		if (!collection.size) return;

		let { original, ...payload } = options;

		const message = original ? await ResponseFormatters.renderMessage(original) : null;

		const results = collection.map((i) => i.registry.editMessage(i.id, merge(message, payload)));

		return Promise.all(results);
	}

	public delete(target: GroupMessageResolvable) {
		const collection = this.getReferenceOf(target);
		if (!collection.size) return;

		collection.map((i) => i.registry.deleteMessage(i.id));
	}

	public getReferenceOf(message: GroupMessageResolvable) {
		const target = this.resolveId(message);

		return this.cache.filter((i) => {
			return i.original?.id === target;
		});
	}

	// Overload for resolve()
	public override resolve(resolvable: GroupMessage): GroupMessage;
	public override resolve(resolvable: GroupMessageResolvable): GroupMessage | null;
	public override resolve(message: any): GroupMessage | null {
		if (message instanceof Message) {
			return super.resolve(message.id);
		}

		return super.resolve(message);
	}

	// Overload for resolveId()
	public override resolveId(resolvable: string | GroupMessage): string;
	public override resolveId(resolvable: GroupMessageResolvable): string | null;
	public override resolveId(message: any) {
		if (message instanceof Message) {
			return super.resolveId(message.id);
		}
		return super.resolveId(message);
	}

	public _addMultiple(...messages: APIGroupMessage[]) {
		for (const message of messages) {
			this._add(message, true, { id: message.message.id, extras: [] });
		}
	}
}
