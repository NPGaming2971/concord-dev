import { Command } from "../structures/Command";

export class CreateCommand extends Command {
	constructor() {
		super({ data: { name: "create", description: "Create a new group of your own." } });
	}

	public override chatInputRun() {}
}
