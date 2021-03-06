import type { Client } from 'discord.js';
import { Logger } from '../../classes/Logger';
import { Listener } from '../../structures/';

export class DebugEvent extends Listener<'debug'> {
	constructor(client: Client) {
		super(client, {
			name: 'debug',
			emitter: client
		});
	}

	public run(string: string) {
		if (/Session Limit Information/g.test(string)) {
			Logger.debug(this.constructor.name, string);
		}

		if (/429/g.test(string)) {
			Logger.debug(this.constructor.name, string)
		}
	}
}
