import { EmbedBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../structures/Command";

export class PingCommand extends Command {
	constructor() {
		super({ data: { name: "ping", description: "Receive the bot ping" } });
	}
	public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply();

		const userPing = new Date().getTime() - interaction.createdTimestamp;
		const websocketPing = Math.round(interaction.client.ws.ping);
		const embed = new EmbedBuilder()
			.setTitle("Pong!")
			.setColor(0x5e92cc)
			.addFields(
				{
					name: "Latency Ping",
					value: `${websocketPing}ms`,
					inline: true,
				},
				{
					name: "API Ping",
					value: `${userPing}ms`,
					inline: true,
				}
			);
		interaction.editReply({ embeds: [embed] });
	}
}