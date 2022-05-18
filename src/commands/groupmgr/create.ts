import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../structures/";

export class CreateCommand extends Command {
	constructor() {
		super({
			data: {
				name: "create",
				description: "Create a new group of your own.",
				options: [
					{
						name: "tag",
						description: "tag",
						type: ApplicationCommandOptionType.String,
						required: true,
					},
				],
			}
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction<"cached">) {
		await interaction.deferReply()

		const tag = interaction.options.getString("tag", true);
		
		if (interaction.client.groups.cache.has(tag))
			return interaction.editReply("already existed");

		interaction.client.groups.create(tag, { owner: interaction.user });

		return interaction.editReply("success");
	}
}