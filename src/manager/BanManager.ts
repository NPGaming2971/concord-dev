import { CachedManager, Client } from "discord.js";

export class GlobalBanManager extends CachedManager<string, any, any> {
    constructor(client: Client) {
        super(client, Object)
    }

    public fetch() {}

    public query() {}

    public create() {}

    public edit() {}

    public delete() {}

    //@ts-expect-error
    private handleTempBan() {}
} 