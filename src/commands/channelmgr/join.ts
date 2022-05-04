import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../structures/";
import type { RegisterableChannel } from "../../typings";

export class JoinCommand extends Command {
	constructor() {
		super({
			data: {
				name: "join",
				description: "Join a group.",
				options: [
					{
						name: "target-group",
						description: "The id or the tag of the group you want to join.",
						type: ApplicationCommandOptionType.String,
						autocomplete: true,
						required: true,
					},
					{
						name: "channel",
						description: "The channel to execute this command in. Defaults to this channel.",
						type: ApplicationCommandOptionType.Channel,
					},
				],
			},
			preconditions: {
				canRunIn: [ChannelType.GuildText, ChannelType.GuildNews],
				requiredUserPermissions: ["ManageChannels"],
			},
		});
	}
	public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
		const channel =
			(interaction.options.getChannel("channel") as RegisterableChannel) ?? interaction.channel;
        const targetGroup = interaction.options.getString('target-group', true);
		 
		await interaction.deferReply();

        const group = interaction.client.groups.cache.find(i => i.tag === targetGroup)

        group?.channels.add(channel)
        interaction.editReply(`Joined ${group?.tag}`)
	}
}
