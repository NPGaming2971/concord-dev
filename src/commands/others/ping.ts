import { EmbedBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../structures/";
import { Constants } from "../../typings/constants";

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
			.setColor(Constants.DEFAULT_COLOR)
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
