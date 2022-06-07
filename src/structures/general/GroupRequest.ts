import { Base, Client, SnowflakeUtil } from 'discord.js';
import type { APIGroupRequest, RegisterableChannel } from '../../typings';
import { RequestState, RequestType } from '../../typings/enums';
import { Error } from '../errors/ConcordError';
import { ChannelRegistry } from './ChannelRegistry';

export interface GroupRequest {
	data: APIGroupRequest
	id: string;
	channelId: string;
	message: string | null;
	type: RequestType;
	state: RequestState;
	groupId: string
}

export class GroupRequest extends Base {
	constructor(client: Client, data: APIGroupRequest, groupId: string) {
		super(client);

		this.data = data
		this.groupId = groupId
		this.patch(data);
	}

	public override toJSON() {
		return { ...this.data }
	}

	public get targetGroup() {
		return this.client.groups.fetch(this.groupId)!
	}

	public get registry() {
		return this.channel.fetchRegistry()
	}
 
	public patch(data: Partial<APIGroupRequest>) {
		if (data.id) this.id = data.id;

		if (data.channelId) this.channelId = data.channelId;

		if (data.message) this.message = data.message;

		if (data.type) this.type = data.type;

		if (data.state) {
			this.state = data.state;
		}
	}

	public setState(state: RequestState) {
		this.patch({ state });
	}

	public get createdTimestamp() {
		return Number(SnowflakeUtil.decode(this.id).timestamp.toString());
	}

	public get createdAt() {
		return new Date(this.createdTimestamp);
	}

	public get channel() {
		return this.client.channels.resolve(this.channelId) as NonNullable<RegisterableChannel>;
	}

	public isPending() {
		return this.state === RequestState.Pending;
	}

	public isAccepted() {
		return this.state === RequestState.Accepted;
	}

	public isDenied() {
		return this.state === RequestState.Denied;
	}

	public execute(state: RequestState) {
		if (state === RequestState.Denied) return this.setState(state);

		switch (this.type) {
			case RequestType.Connect:

				if (!this.registry) throw new Error('NON_EXISTENT_RESOURCE', ChannelRegistry.name, this.channelId)

				if (this.registry.groupId) throw new Error('DUPLICATED_RESOURCE', 'Property', 'groupId', `registry '${this.channelId}'`)

				this.targetGroup.channels.add(this.channelId);
				this.setState(state);
		}
	}
}