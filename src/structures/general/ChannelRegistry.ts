import { Awaitable, Base, Client, MessageResolvable, WebhookClient, WebhookMessageOptions } from 'discord.js';
import type { APIMessage } from 'discord.js/node_modules/discord-api-types/v10';
import type { APIChannelRegistry, RegisterableChannel } from '../../typings';

import { Util } from '../../utils/utils';
import { ConcordError } from '../errors/ConcordError';
import type { Group } from './Group';

export interface ChannelRegistry<Registered extends boolean = boolean> {
	channelId: string;
	webhook: string | null;
	groupId: string | null;
	group: Group | null;
}

export class ChannelRegistry extends Base implements ChannelRegistry {
	constructor(client: Client, data: APIChannelRegistry, group: Group | null = null) {
		super(client);
		this.group = group;

		this._patch(data);
	}

	public _patch(data: APIChannelRegistry) {
		if ('id' in data) {
			this.channelId = data.id;
		}

		if ('webhookurl' in data) {
			this.webhook = data.webhookurl;
		}

		if ('groupId' in data) {
			this.groupId = data.groupId;
		}

		return this;
	}

	public get channel() {
		return this.client.channels.cache.get(this.channelId) as RegisterableChannel;
	}

	private createOneTimeClient(func: (client: WebhookClient) => Awaitable<any>) {
		const client = new WebhookClient({url: this.webhook!})

		const action = func(client)

		client.destroy()
		return action
	}

	private validateActionConditions() {
		if (!this.isRegistered()) throw new ConcordError('CHANNEL_UNREGISTERED');
	}

	public async send(options: WebhookMessageOptions | string): Promise<APIMessage> {
		this.validateActionConditions();

		return this.createOneTimeClient((client) => client.send(options))
	}

	public async editMessage(target: MessageResolvable, options: WebhookMessageOptions | string): Promise<APIMessage> {
		this.validateActionConditions();

		return this.createOneTimeClient((client) => client.editMessage(target, options));
	}

	public async deleteMessage(target: MessageResolvable): Promise<void> {
		this.validateActionConditions();

		return this.createOneTimeClient((client) => client.deleteMessage(target));
	}

	public fetchWebhook() {
		if (!this.isRegistered()) throw new ConcordError('CHANNEL_UNREGISTERED');

		const { token, id } = Util.destructureWebhookURL(this.webhook!);

		return this.client.fetchWebhook(id, token);
	}

	public isRegistered() {
		return !!this.webhook;
	}

	public edit(options: GroupEditOptions) {
		const { fallback } = Util;
		const { url, groupId } = options;

		const partialData = {
			channel: this.channel,
			url: fallback(url, this.webhook),
			groupId: fallback(groupId, this.groupId)
		};

		return this.client.registry.create(partialData);
	}

	public delete() {
		this.client.registry.delete(this.channel.id);
	}
}

type GroupEditOptions = {
	url?: string | null;
	groupId?: string | null;
};
