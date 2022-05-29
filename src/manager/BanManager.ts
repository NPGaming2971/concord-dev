import { CachedManager, Client } from "discord.js";

export class GlobalBanManager extends CachedManager<string, any, any> {
    constructor(client: Client) {
        super(client, Object)
    }

    
}