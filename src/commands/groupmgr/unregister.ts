import {
	ApplicationCommandOptionType,
	ChannelType,
	ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../../structures/";
import type { RegisterableChannel } from "../../typings";

export class UnregisterCommand extends Command {
	constructor() {
		super({
			data: {
				name: "unregister",
				description: "Register a channel to be ready to connect to Concord group.",
				options: [
					{
						name: "channel",
						description: "The channel to unregister.",
						type: ApplicationCommandOptionType.Channel,
						channelTypes: [ChannelType.GuildText, ChannelType.GuildNews],
					},
				],
			},
			preconditions: {
				canRunIn: [ChannelType.GuildText, ChannelType.GuildNews],
				requiredClientPermissions: ["ManageWebhooks"],
				requiredUserPermissions: ["ManageChannels"],
			},
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction<"cached">) {
		const channel =
			(interaction.options.getChannel("channel") as RegisterableChannel) ?? interaction.channel;

		await interaction.deferReply();

		const registry = interaction.client.registry.fetch(channel);

		if (!registry) return interaction.editReply(`No record of my webhook found in ${channel}.`);

		if (registry.webhook) {
			try {
				const webhook = await registry.fetchWebhook();

				webhook.delete();
			} catch(err) {
				console.log(err)
			}
		}

		registry.delete();

		interaction.editReply('Success')

		return;
	}
}
