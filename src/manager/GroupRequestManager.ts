import { CachedManager, ChannelResolvable, SnowflakeUtil } from 'discord.js';
import { pullAllBy } from 'lodash';
import type { Group } from '../structures';
import { GroupRequest } from '../structures/general/GroupRequest';
import { RequestState, RequestType } from '../typings/enums';

export interface GroupRequestManager {
	group: Group;
}

export class GroupRequestManager extends CachedManager<string, GroupRequest, any> {
	constructor(group: Group, iterable?: Iterable<any>) {
		//@ts-expect-error
		super(group.client, GroupRequest, iterable);

		this.group = group;
	}

	public create(options: GroupRequestCreateOption) {
		const { channel, type, message = null } = options;

		const { requests } = this.group.data.entrance;

		const channelId = this.client.channels.resolveId(channel);
		const data = {
			channelId,
			type,
			message,
			id: SnowflakeUtil.generate().toString(),
			state: RequestState.Pending
		};

		requests.push(data);

		this.group.edit({ entrance: { requests } });
		const result = this._add(data, true, { id: data.id, extras: [] });

		// Avoid duplicates
		if (this.group.getSetting('requests.deleteDuplicate')) {
			const last = this.cache.last();
			this.bulkDelete((i) => i.channelId === result.channelId && i.isPending() && i.id !== last?.id);
		}
		return result;
	}

	delete(id: string) {
		const target = this.resolve(id);
		const { requests } = this.group.data.entrance;

		pullAllBy(requests, [target], 'id');
		
		this.cache.delete(id);
		this.group.edit({ entrance: { requests } });
	}

	bulkDelete(fn: FilterFunction = () => true) {
		const targets = this.cache.filter(fn);
		const { requests } = this.group.data.entrance;

		pullAllBy(requests, targets.toJSON(), 'id');
		this.group.edit({ entrance: { requests } });
	}
}

type FilterFunction = (i: GroupRequest) => boolean;
interface GroupRequestCreateOption {
	channel: ChannelResolvable;
	message?: string;
	type: RequestType;
}
