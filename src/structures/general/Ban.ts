import { Base, Client } from 'discord.js';

export class Ban extends Base {

	constructor(client: Client, _rawBanData: any) {
		super(client);
	}

    public _patch() {}

}
