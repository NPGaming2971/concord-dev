import {
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	ActionRowBuilder,
	Formatters,
	MessageComponentInteraction,
	ModalSubmitInteraction,
	TextInputStyle,
	ModalBuilder,
	TextInputBuilder,
	SelectMenuBuilder
} from 'discord.js';

import { Command, Error, Group, ResponseFormatters } from '../../structures/';
import Settings, { Setting } from '../../../assets/settings';
import Fuse from 'fuse.js';
import { Util } from '../../utils/';
import { isOk } from '@sapphire/result';
export class SettingsCommand extends Command {
	constructor() {
		super({
			data: {
				name: 'settings',
				description: 'Receive the bot ping',
				options: [
					{
						name: 'target-group',
						description: 'The group to change settings on.',
						type: ApplicationCommandOptionType.String,
						autocomplete: true,
						required: true
					},
					{
						name: 'option-name',
						description: 'The setting you want to modify.',
						type: ApplicationCommandOptionType.String,
						autocomplete: true
					},
					{
						name: 'ephemeral',
						description: 'Whether to reply ephemerally. [default: false]',
						type: ApplicationCommandOptionType.Boolean
					}
				]
			}
		});
	}
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>): Promise<any> {
		const inputGroup = interaction.options.getString('target-group', true);
		const inputOptionName = interaction.options.getString('option-name');
		const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;

		const option = Settings.find((i) => i.path === inputOptionName);

		if (!option) return interaction.editReply('No such option.');

		const hidden = (option.isString() && option.hidden) || ephemeral;

		await interaction.deferReply({ ephemeral: hidden });

		const group = interaction.client.groups.fetch(inputGroup);
		if (!group) return interaction.editReply(ResponseFormatters.prepareError(new Error('NON_EXISTENT_RESOURCE', Group.name, inputGroup)));

		const groupData = Util.flatten(group.toJSON());
		const embed = this.appendCurrentValue(option, groupData);

		const response = await interaction.editReply({ embeds: [embed], components: this.renderComponents(option) });

		const filter = (i: MessageComponentInteraction) => {
			if (i.user.id === interaction.user.id) return true;
			else {
				i.reply({
					content: 'Not your menu.',
					ephemeral: true
				});
				return false;
			}
		};

		const collector = response.createMessageComponentCollector({ filter, idle: 15000 });

		collector
			.on('collect', async (i): Promise<any> => {
				if (i.isSelectMenu()) {
					i.deferUpdate();
					const newValue = i.values[0];
					updateGroup({ group, interaction, newValue, option });
				}

				if (i.isButton()) {
					if (i.customId === 'settings/toggle') {
						i.deferUpdate();
						updateGroup({ newValue: !groupData[option.path], option, group, interaction });
					}

					if (i.customId === 'settings/resetToDefault') {
						i.deferUpdate();
						updateGroup({ newValue: option.default, option, group, interaction });
					}

					if (i.customId === 'settings/setNewValue') {
						if (!option.isString()) return;

						const filter = (m: ModalSubmitInteraction) => m.user.id === i.user.id && m.customId === `concord:settings/${i.id}`;

						const [min, max] = option.restraints?.lengthRange ?? [0, 4000];
						const textField = new TextInputBuilder()
							.setCustomId(`textInput`)
							.setStyle(option.style ?? TextInputStyle.Short)
							.setLabel('New value')
							.setMinLength(min ?? 0)
							.setMaxLength(max ?? 4000)
							.setValue(groupData[option.path] ?? '')
							.setRequired(true);

						const modal = new ModalBuilder()
							.setComponents([new ActionRowBuilder<TextInputBuilder>().setComponents([textField])])
							.setCustomId(`concord:settings/${i.id}`)
							.setTitle(`${option.help?.category ?? 'Unknown'}: ${option.name}`);

						i.showModal(modal);

						try {
							const modalInteraction = await i.awaitModalSubmit({ time: 999000, filter });

							const newValue = modalInteraction.fields.getTextInputValue('textInput');

							const validationCheck = await option.validate(newValue, group);

							if (!isOk(validationCheck)) {
								return modalInteraction.reply({ content: `Validation failed:\n` + validationCheck.error, ephemeral: hidden });
							}

							updateGroup({ newValue, option, group, interaction: modalInteraction });
						} catch (_) {}
					}
				}
			})
			.on('end', () => {
				interaction.editReply({ components: [] });
			});

		type UpdateGroupOption = {
			newValue: string | number | boolean | null;
			option: Setting;
			group: Group;
			interaction: any;
		};
		const updateGroup = ({ group, interaction, newValue, option }: UpdateGroupOption) => {
			groupData[option.path] = newValue;

			group.edit(Util.unflatten(groupData));
			interaction[interaction.replied ? 'editReply' : 'update']({
				embeds: [this.appendCurrentValue(option, groupData)]
			});
		};
	}

	public override autocompleteRun(interaction: AutocompleteInteraction) {
		const focusedValue = interaction.options.getFocused(true);

		const value = String(focusedValue.value);

		switch (focusedValue.name) {
			case 'option-name':
				if (!value.length)
					return interaction.respond(Settings.map((i) => ({ name: `${i.help?.category}: ${i.name}`, value: i.path })).slice(0, 25));

				const fuse = new Fuse(Settings, {
					keys: ['name', 'help.category'],
					includeScore: true,
					shouldSort: true
				});

				const results = fuse.search(value);

				return interaction.respond(
					results.map((i) => ({ name: `${i.item.help?.category}: ${i.item.name}`, value: i.item.path })).slice(0, 25)
				);
			case 'target-group':
				const coll = interaction.client.groups.cache.filter((i) => i.ownerId === interaction.user.id);

				return interaction.respond(
					coll
						.filter((i) => i.tag.startsWith(value))
						.map((e) => ({ name: e.tag, value: e.id }))
						.sort()
				);
			default:
				return interaction.respond([]);
		}
	}

	private appendCurrentValue(option: Setting, flattenedGroup: { [key: string]: any }) {
		const isParagraph = option.isString() && option.style === TextInputStyle.Paragraph;

		const data = Util.escapeMaskedLink(Util.escapeQuote(String(flattenedGroup[option.path])));

		return this.parseOption(option, flattenedGroup.tag).addFields([
			{
				name: 'Current value',
				value: isParagraph ? data : Formatters.inlineCode(data),
				inline: !isParagraph
			}
		]);
	}

	private parseOption(option: Setting, groupTag: string) {
		const embed = new EmbedBuilder()
			.setAuthor({ name: `in: ${option.help?.category ?? 'Uncategorized'}` })
			.setDescription(option.description?.length ? option.description : 'No description provided.')
			.setTitle(`${option.help?.category ?? 'Unknown'}: ${option.name}`)
			.setFooter({
				text: `Currently setting: '@${groupTag}'. Option type: '${option.type}'.`
			})
			.addFields([
				{
					name: 'Default value',
					value: Formatters.inlineCode(String(option.default)),
					inline: true
				}
			]);

		if (option.isChoices()) {
			embed.spliceFields(0, 0, {
				name: 'Available options',
				value: option.options
					.map(
						(e) =>
							`> **${e.name}** (${Formatters.inlineCode(String(e.value))})\n${
								e.description?.length ? e.description : 'No description provided.'
							}`
					)
					.join(`\n\n`)
			});
		}

		return embed;
	}

	private renderComponents(setting: Setting) {
		const resetButton = new ButtonBuilder().setCustomId('settings/resetToDefault').setLabel('Reset to default').setStyle(ButtonStyle.Secondary);

		const baseButtonActionRow = new ActionRowBuilder<ButtonBuilder>().setComponents([resetButton]);
		const baseSelectMenuActionRow = new ActionRowBuilder<SelectMenuBuilder>();

		if (setting.isString()) {
			const setNewValueButton = new ButtonBuilder().setCustomId('settings/setNewValue').setLabel('Set new value').setStyle(ButtonStyle.Primary);
			baseButtonActionRow.setComponents([setNewValueButton, resetButton]);
		}

		if (setting.isBoolean()) {
			const toggleButton = new ButtonBuilder().setCustomId('settings/toggle').setLabel('Toggle').setStyle(ButtonStyle.Primary);
			baseButtonActionRow.setComponents([toggleButton, resetButton]);
		}

		if (setting.isChoices()) {
			const choiceMenu = new SelectMenuBuilder()
				.setCustomId('settings/menu')
				.setMaxValues(1)
				.setMinValues(1)
				.setPlaceholder('Choose an option...')
				.setOptions(setting.options.map((option) => ({ label: option.name, value: String(option.value) })));

			baseSelectMenuActionRow.setComponents([choiceMenu]);
		}
		return baseSelectMenuActionRow.components.length ? [baseSelectMenuActionRow, baseButtonActionRow] : [baseButtonActionRow];
	}
}
