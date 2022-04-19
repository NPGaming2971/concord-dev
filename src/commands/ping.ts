import type { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../structures/Command";

export default class PingCommand extends Command {
	constructor() {
		super({ data: { name: "create", description: "Receive the bot ping" } });
	}
	public override async chatInputRun(
		interaction: ChatInputCommandInteraction
	): Promise<void> {
		interaction.reply(`Pong! ${interaction.client.ws.ping}ms`);
		throw new Error('hi')
	}
}
