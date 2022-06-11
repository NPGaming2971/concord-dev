
import type { Client } from 'discord.js';
import { Listener } from '../../structures';
import type { RegisterableChannel } from '../../typings';


export default class WebhookUpdateEvent extends Listener<'webhookUpdate'> {
	constructor(client: Client) {
		super(client, { name: 'webhookUpdate', emitter: client });
	}

	public async run(channel: RegisterableChannel) {
		if (!channel.isRegisterable()) return;

		const registry = channel.fetchRegistry();

		const webhooks = await channel.fetchWebhooks();

		const myWebhooks = webhooks.filter((w) => w.owner?.id === channel.client.user?.id);

		const [correct, violation] = myWebhooks.partition((i) => i.url === registry?.webhook);

		console.log(`Correct: ${correct.size}\nViolation: ${violation.size}`);

		if (!correct.size && registry?.isRegistered()) {
			const webhook = await channel.createWebhook('Concord', { reason: 'Auto fix webhooks change.' });

			registry.edit({ url: webhook.url });
			webhook.send(
				'Unauthorized webhook location change violation detected. Successfully reordered.\nIf you are attempting to unregister a channel, please use `/unregister` next time.'
			);
		}

		if (violation.size) {
			violation.map(async (i) => {
				const matchingRegistry = channel.client.registry.query({ url: i.url })[0];

				console.log(matchingRegistry);

				if (matchingRegistry) {
					await i.edit({ channel: matchingRegistry.channelId });
					i.send(
						'Unauthorized webhook location change violation detected. Successfully reordered.\nIf you are attempting to unregister a channel, please use `/unregister` next time.'
					);
				} else {
					i.delete();
				}
			});
		}
	}

	public handleViolationPenalty() {}
}
