import { EmbedBuilder } from "@discordjs/builders";
import {
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	AutocompleteInteraction,
} from "discord.js";
import { Command } from "../../structures/";
import Fuse from "fuse.js";
import { Constants } from "../../typings/constants";
export class HelpCommand extends Command {
	constructor() {
		super({
			data: {
				name: "help",
				description: "View help on a command.",
				options: [
					{
						name: "command",
						description: "The id or the tag of the group you want to join.",
						type: ApplicationCommandOptionType.String,
						autocomplete: true,
					},
				],
			}
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<any> {
		await interaction.deferReply();

		const targetCommand = interaction.options.getString("command")?.toLowerCase();

		if (targetCommand) {
			const command = interaction.client.commands.cache.find(
				(i) => i.data.name === targetCommand
			);

			if (!command)
				return interaction.editReply("Failed to find any command with such name.");

			if (
				command.preconditions?.elevatedPermissions &&
				!Constants.Administrators.includes(interaction.user.id)) 
				return interaction.editReply('You are not authorized to view this resources.')

			interaction.editReply({ embeds: [renderCommandEmbed(command)] });
		}
	}

	public override async autocompleteRun(interaction: AutocompleteInteraction) {
		const focusedValue = interaction.options.getFocused(true);

		const commands = interaction.client.commands.cache
			.filter((e) => !e.preconditions?.elevatedPermissions ?? true)
			.map((i) => ({ name: i.data.name, value: i.data.name }));

		const string = focusedValue.value.toString().toLowerCase();

		if (!string.length) return interaction.respond(commands);

		const fuse = new Fuse(commands, { shouldSort: true, keys: ["name"], includeScore: true });

		const results = fuse.search(string);

		const choices = results.map((i) =>
			i.score! < 0.01 ? { ...i.item, name: `⭐ ${i.item.name}` } : i.item
		);

		interaction.respond(choices);
	}
}

function renderCommandEmbed(command: Command) {
	const { name, description, options } = command.data;

	return new EmbedBuilder()
		.setTitle(name)
		.setDescription(description)
		.addFields({
			name: "Syntax",
			value: `/${name} ${
				options
					?.map((e) => `{${e.name}: ${ApplicationCommandOptionType[e.type]}}`)
					.join(" ") ?? ""
			}`,
		});
}
