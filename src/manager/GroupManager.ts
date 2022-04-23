import { CachedManager, Client } from "discord.js";
import { Command } from "../structures/Command";

export class GroupManager extends CachedManager<string, any, any> {
	constructor(client: Client, iterable?: Iterable<any>) {
		//TODO: Temporary placeholder
		//@ts-expect-error
		super(client, Command, iterable);
    }
}
