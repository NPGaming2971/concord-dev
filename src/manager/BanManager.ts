import { CachedManager, Client } from "discord.js";
import { Ban } from "../structures/general/Ban";
import type { BanResolvable } from "../typings";

export class GlobalBanManager extends CachedManager<string, Ban, BanResolvable> {
    constructor(client: Client) {
        super(client, Ban)
    }

    public fetch(_ban: BanResolvable) {}

    public query() {}

    public create() {}

    public edit() {}

    public delete() {}

    //@ts-expect-error
    private handleTempBan() {}
} 