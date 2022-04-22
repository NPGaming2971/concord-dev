import type { Client } from "discord.js";
import type { ConcordClient } from "../../classes/ConcordClient";
import { Listener } from "../../structures/Listener";

export default class ReadyEvent extends Listener<"ready"> {
	constructor(client: Client) {
		super(client, { name: "ready", once: true });
	}
	public async run(client: ConcordClient) {
		const { tag } = client.user;
		client.logger.info(this.constructor.name, `${tag} is ready!`);
	}
}
