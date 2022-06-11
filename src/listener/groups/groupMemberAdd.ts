import type { Client } from 'discord.js';
import { ChannelRegistry, Listener } from '../../structures/';
import type { RegisterableChannel } from '../../typings';

export class GroupMemberAddEvent extends Listener<'groupMemberAdd'> {
	constructor(client: Client) {
		super(client, { name: 'groupMemberAdd', once: true });
	}

    public override run(registry: ChannelRegistry) {
        
        const logChannelId = registry.group?.settings.logChannelId

        if (!logChannelId) return

        const logChannel = registry.client.channels.cache.get(logChannelId) as RegisterableChannel

        logChannel.send('test')
    }
}
