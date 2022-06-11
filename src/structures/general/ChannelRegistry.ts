import { Awaitable, Base, Client, If, MessageResolvable, Webhook, WebhookClient, WebhookMessageOptions } from 'discord.js';
import type { APIMessage } from 'discord.js';
import type { APIChannelRegistry, RegisterableChannel } from '../../typings';

import { Util } from '../../utils/';
import { Error } from '../errors/ConcordError';
import { assignInWith, isUndefined } from 'lodash';

export interface ChannelRegistry<Registered extends boolean = boolean> {
	channelId: string;
	webhook: If<Registered, string>;
	groupId: string | null;
}

export class ChannelRegistry extends Base implements ChannelRegistry {
	#data: APIChannelRegistry;

	constructor(client: Client, rawGroupData: APIChannelRegistry) {
		super(client);

		this.#data = rawGroupData;
		this._patch(rawGroupData);
	}

	public _patch(data: APIChannelRegistry) {
		if ('id' in data) {
			this.channelId = data.id;
		}

		if ('url' in data) {
			//@ts-expect-error
			this.webhook = data.url;
		}

		if ('groupId' in data) {
			this.groupId = data.groupId;
		}

		return this;
	}

	public get group() {
		return this.groupId ? this.client.groups.fetch(this.groupId)! : null;
	}

	public get channel() {
		return this.client.channels.cache.get(this.channelId) as RegisterableChannel;
	}

	private createTempClient(func: (client: WebhookClient) => Awaitable<any>) {
		const client = new WebhookClient({ url: this.webhook! });

		const action = func(client);

		client.destroy();
		return action;
	}

	private validateActionConditions() {
		if (!this.isRegistered()) throw new Error('CHANNEL_UNREGISTERED', this.channel);
	}

	public async send(options: WebhookMessageOptions | string): Promise<APIMessage> {
		this.validateActionConditions();

		return this.createTempClient((client) => client.send(options));
	}

	public async editMessage(target: MessageResolvable, options: WebhookMessageOptions | string): Promise<APIMessage> {
		this.validateActionConditions();

		return this.createTempClient((client) => client.editMessage(target, options));
	}

	public async deleteMessage(target: MessageResolvable): Promise<void> {
		this.validateActionConditions();

		return this.createTempClient((client) => client.deleteMessage(target));
	}

	public fetchWebhook(): Promise<Webhook> {
		if (!this.isRegistered()) throw new Error('CHANNEL_UNREGISTERED', this.channel);

		const { token, id } = Util.destructureWebhookURL(this.webhook!);

		return this.client.fetchWebhook(id, token);
	}

	public isRegistered(): this is ChannelRegistry<true> {
		return !!this.webhook;
	}

	public edit(options: GroupEditOptions) {
		const partialData = assignInWith(this.toJSON(), { channelId: this.channel, ...options }, (obj, src) => {
			return isUndefined(src) ? obj : src;
		});

		return this.client.registry.create(partialData);
	}

	public override toJSON() {
		return { ...this.#data };
	}

	public delete() {
		return this.client.registry.delete(this.channelId);
	}
}

type GroupEditOptions = {
	url?: string | null;
	groupId?: string | null;
};
