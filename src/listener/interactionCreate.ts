import type { AutocompleteInteraction, Client, Interaction } from "discord.js";
import { Listener } from "../structures/Listener";
import { Util } from "../utils/utils";

export default class InteractionCreateEvent extends Listener<"interactionCreate"> {
	constructor(client: Client) {
		super(client, { name: "interactionCreate" });
	}
	public async run(interaction: Interaction) {
		if (!interaction.isCommand()) return;
		const command = interaction.client.commands.cache.get(
			interaction.commandName
		);
		if (!command) return interaction.reply("Command not found.");

		if (interaction.isChatInputCommand()) {
			if (command.supportChatInput()) {
				Util.fromAsync(command.chatInputRun.bind(null, interaction));
			}
		}
		if (interaction.isContextMenuCommand()) {
			if (command.supportContextMenu()) {
				Util.fromAsync(command.contextMenuRun.bind(null, interaction));
			}
		}

		if (interaction.isAutocomplete()) {
			if (command.supportAutocomplete()) {
				Util.fromAsync(command.autocompleteRun(interaction));
			}
		}

		return;
	}
}
