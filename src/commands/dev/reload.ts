import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction, Formatters } from 'discord.js';
import { without } from 'lodash';
import { Command } from '../../structures/';

export class ReloadCommand extends Command {
	constructor() {
		super({
			data: {
				name: 'reload',
				description: 'Reload a command.',
				options: [
					{
						name: 'command',
						description: 'The command to reload.',
						autocomplete: true,
						type: ApplicationCommandOptionType.String,
						required: true
					}
				]
			},
			preconditions: {
				elevatedPermissions: true
			},
			restraints: {
				global: false
			}
		});
	}

	public override async autocompleteRun(interaction: AutocompleteInteraction) {
		const focusedValue = interaction.options.getFocused(true);

		const choices = interaction.client.commands.cache
			.map((c) => ({
				name: c.data.name,
				value: c.data.name
			}))
			.filter((c) => c.name.toLowerCase().startsWith(focusedValue.value as string));

		choices.push({ name: 'all', value: 'all' }, { name: 'events', value: 'events' }, { name: 'structures', value: 'structures' });
		interaction
			.respond(choices.sort((a, b) => a.name.localeCompare(b.name)))
			.catch((err) => interaction.client.logger.error('Autocomplete failed', err));
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<any> {
		await interaction.deferReply();
		const { client, options } = interaction;
		const commandToReload = options.getString('command', true).toLowerCase();

		if (commandToReload === 'events') {
			const eventFolderPath = `${process.cwd()}/src/listener/`;
			const listenersCount = client.getMaxListeners();

			const eventNames = client.eventNames();

			for (const eventName of without(eventNames, 'shardDisconnect')) {
				client.removeAllListeners(eventName as string);
			}

			client.setMaxListeners(listenersCount);

			client.commands.load({
				path: { events: eventFolderPath },
				options: {
					errorOnEmptyFile: true,
					errorOnNoMatches: true,
					extensions: ['ts'],
					subfolderDepth: 2
				}
			});

			return interaction.editReply('Successfully reloaded all events.');
		} else if (commandToReload === 'all') {
			try {
				client.commands.load({
					path: {
						commands: `${process.cwd()}/src/commands/`
					},
					options: {
						extensions: ['ts'],
						subfolderDepth: 1
					}
				});
				interaction.editReply('Reloaded all commands.');
			} catch (err) {
				console.error(err);
				return interaction.editReply(`Failed to reload all commands. ${err}`);
			}
		} else {
			try {
				const command = client.commands.cache.get(commandToReload);

				if (!command) return interaction.editReply(`No such command ${Formatters.inlineCode(commandToReload)}`);

				client.commands.load({
					path: {
						commands: command.path
					}
				});
				interaction.editReply(`Successfully reloaded \`${commandToReload}\` command.`);
			} catch (err) {
				console.error(err);
				interaction.editReply(`Failed to load command.\n${err}`);
			}
		}
	}
}
