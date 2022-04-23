import type { Client, Interaction } from "discord.js";
import { Listener } from "../structures/Listener";
import { Util } from "../utils/utils";

export class InteractionCreateEvent extends Listener<"interactionCreate"> {
	constructor(client: Client) {
		super(client, { name: "interactionCreate" });
	}
	public async run(interaction: Interaction) {
		if (interaction.isCommand()) {
			const command = interaction.client.commands.cache.get(interaction.commandName);
			if (!command) return interaction.reply("Unknown command.");

			if (interaction.isChatInputCommand()) {
				if (command.supportChatInput()) {
					Util.fromAsync(command.chatInputRun.bind(command, interaction));
				}
			}
			if (interaction.isContextMenuCommand()) {
				if (!command.supportContextMenu()) return;

				if (interaction.isMessageContextMenuCommand() && command.supportMessageContextMenu())
					Util.fromAsync(command.messageContextMenuRun.bind(command, interaction));

				if (interaction.isUserContextMenuCommand() && command.supportUserContextMenu())
					Util.fromAsync(command.userContextMenuRun.bind(command, interaction));
			}
		} else if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.cache.get(interaction.commandName);
			if (!command) return interaction.respond([{ name: "Unknown command.", value: "unknown" }]);

			if (command.supportAutocomplete()) {
				Util.fromAsync(command.autocompleteRun.bind(command, interaction));
			}
		}
	}
}
