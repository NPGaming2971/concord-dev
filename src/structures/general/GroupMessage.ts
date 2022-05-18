import { Base, Client } from 'discord.js';
import type { APIMessage } from 'discord.js/node_modules/discord-api-types/v10';
import type { APIGroupMessage, RegisterableChannel } from '../../typings';
import { Util } from '../../utils/utils';
import type { ChannelRegistry } from './ChannelRegistry';
import type { Group } from './Group';

export interface GroupMessage {
	webhook: string;
	parentId: [string, string];
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
		return (this.client.channels.cache.get(channelId) as RegisterableChannel)?.messages.fetch(messageId);
	}

	public hasParent() {
		return Reflect.has(this, 'parentId');
	}

	public fetchWebhook() {
		const { id, token } = Util.destructureWebhookURL(this.webhook);
		return this.client.fetchWebhook(id, token)
	}
}
