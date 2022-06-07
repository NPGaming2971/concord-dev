import type { Client } from 'discord.js';
import { Listener } from '../../structures';
import type { RegisterableChannel } from '../../typings';

export class WebhookUpdateEvent extends Listener<'webhookUpdate'> {
	constructor(client: Client) {
		super(client, { name: 'webhookUpdate', emitter: client });
	}

    public async run(channel: RegisterableChannel) {

        if (!channel.isRegisterable()) return

        const registry = channel.fetchRegistry()

        const webhooks = await channel.fetchWebhooks()

        const myWebhooks = webhooks.filter(w => w.owner?.id === channel.client.user?.id)

        const [correct, violation] = myWebhooks.partition(i => i.url === registry?.webhook)
        
        if (!correct.size && registry?.isRegistered()) {
            const webhook = await channel.createWebhook('Concord', { reason: 'Auto fix webhooks change.' })

            registry.edit({ url: webhook.url })


        }

        if (violation.size) {
            violation.map(i => {
                //@ts-expect-error
                const matchingRegistry = channel.client.registry.fetch(i.url)
            })
        }
    }
}
