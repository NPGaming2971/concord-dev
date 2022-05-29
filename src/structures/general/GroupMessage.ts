import { Base, Client } from 'discord.js';
import type { APIMessage } from 'discord.js/node_modules/discord-api-types/v10';
import type { APIGroupMessage, RegisterableChannel } from '../../typings';
import { Util } from '../../utils/';
import type { ChannelRegistry } from './ChannelRegistry';
import type { Group } from './Group';
import { compact } from 'lodash'
import { ConcordError } from '../errors/ConcordError';

export interface GroupMessage {
	webhook: string;
	parentId: [string, string] | [null, null];
	message: APIMessage
	group: Group;
	registry: ChannelRegistry
	id: string
}

export class GroupMessage extends Base {
	constructor(client: Client, data: APIGroupMessage, group: Group) {
		super(client);

		this.group = group;
		this.patch(data);
	}

	public patch(data: APIGroupMessage) {
		this.webhook = data.url;
		this.parentId = data.parentId;
		this.registry = data.registry
		this.id = data.message.id
		this.message = data.message;
	}

	public fetchParent() {
		const [channelId, messageId] = this.parentId;

		if (!messageId || !channelId) throw new ConcordError('THIS_MESSAGE_IS_ORPHANED')

		const channel = this.client.channels.cache.get(channelId) as RegisterableChannel | undefined
		return channel?.messages.fetch(messageId);
	}

	public hasParent() {
		return Boolean(compact(this.parentId).length)
	}

	public fetchWebhook() {
		const { id, token } = Util.destructureWebhookURL(this.webhook);
		return this.client.fetchWebhook(id, token)
	}
}
