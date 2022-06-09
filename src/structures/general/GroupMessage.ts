import { Base, Client, Message } from 'discord.js';
import type { APIMessage } from 'discord.js';
import type { APIGroupMessage } from '../../typings';
import type { ChannelRegistry } from './ChannelRegistry';


export interface GroupMessage {
	original?: Message
	message: APIMessage;
	registry: ChannelRegistry;
	id: string;
}

export class GroupMessage extends Base {
	constructor(client: Client, data: APIGroupMessage) {
		super(client);

		this.patch(data);
	}

	public patch(data: APIGroupMessage) {
		if (data.message) {
			this.id = data.message.id
			this.message = data.message
		}

		if (data.original) {
			this.original = data.original
		}

		if (data.registry) {
			this.registry = data.registry
		}
	}

	public fetchOriginal() {
		return this.original ? this.registry.channel.messages.fetch(this.original?.id) : null
	}

	public fetchWebhook() {
		return this.registry.fetchWebhook()
	}
}
