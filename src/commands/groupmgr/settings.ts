import { ModalBuilder } from '@discordjs/builders';
import { isOk, ok } from '@sapphire/result';
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	Formatters,
	MessageComponentInteraction,
	ModalMessageModalSubmitInteraction,
	SelectMenuBuilder,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js';

import Fuse from 'fuse.js';
import { isEmpty, isNull, isNumber, isUndefined } from 'lodash';
import Settings, { ImageSetting, Setting, StringSetting } from '../../../assets/settings';
import { Command, Error, Group } from '../../structures/';
import { AutocompleteCommon } from '../../structures/utils/AutocompleteCommon';
import { Constants } from '../../typings/constants';
import { Util } from '../../utils';

export class SettingsCommand extends Command {
	constructor() {
		super({
			data: {
				name: 'settings',
				description: 'Change various settings of your group.',
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
		// Getting user input.
		const inputGroup = interaction.options.getString('target-group', true);
		const inputOptionName = interaction.options.getString('option-name');

		// Ephemeral options
		const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;

		const setting = Settings.find((setting) => setting.path === inputOptionName);

		if (!setting) return interaction.reply('No such thing.');
		await interaction.deferReply({ ephemeral: setting.ephemeral || ephemeral });

		const group = interaction.client.groups.fetch(inputGroup);
		if (!group) throw new Error('UnknownResource', Group.name, inputGroup);

		// Check user eligibility.
		if (group.ownerId !== interaction.user.id) throw new Error('ElevatedPermissionsRequired');

		// Check setting preconditions.
		const preconditions = setting.preconditions(group, interaction.user);

		const groupData = Util.flatten(group.toJSON());

		const response = await interaction.editReply({
			embeds: [this.renderEmbed(setting, { group, currentValue: groupData[setting.path], errorMessage: preconditions.error?.message })],
			components: this.renderComponents(setting, !!preconditions.error?.message)
		});

		const collector = response.createMessageComponentCollector({ filter: Constants.BaseFilter(interaction), idle: 35000 });
		collector
			.on('collect', async (i) => {
				const baseOptions = { interaction: i, setting, group, data: groupData };
				let newValue;
				let interaction: ModalMessageModalSubmitInteraction | MessageComponentInteraction = i;

				if (i.isSelectMenu()) {
					newValue = i.values[0];
				}

				if (i.isButton()) {
					switch (i.customId) {
						case 'settings/resetToDefault': {
							newValue = setting.default;
							break;
						}
						case 'settings/toggle': {
							newValue = !groupData[setting.path];
							break;
						}
						case 'settings/setNewValue': {
							const result = (await this.getNewValue(baseOptions))!;

							newValue = result.newValue;
							interaction = result.interaction as ModalMessageModalSubmitInteraction<'cached'>;

							break;
						}
					}
				}

				const result = await this.updateGroup({ ...baseOptions, newValue });

				//@ts-expect-error
				interaction[interaction.deferred || interaction.replied ? 'editReply' : 'update']({
					embeds: [
						this.renderEmbed(setting, {
							group,
							currentValue: isOk(result) ? result.value : groupData[setting.path],
							errorMessage: isOk(result) ? undefined : result.error.message
						})
					]
				});
			})
			.on('end', (_, reason) => {
				if (reason === 'idle') {
					interaction.editReply({ components: this.renderComponents(setting, true) });
				}
			});
	}

	public override autocompleteRun(interaction: AutocompleteInteraction<'cached'>) {
		const focused = interaction.options.getFocused(true);
		const typing = String(focused.value);

		switch (focused.name) {
			case 'target-group': {
				return AutocompleteCommon.groupAutocomplete(interaction, true);
			}

			case 'option-name': {
				if (!typing.length)
					return interaction.respond(Settings.map((i) => ({ name: `${i.category}: ${i.name}`, value: i.path })).slice(0, 25));

				const fuse = new Fuse(Settings, {
					keys: ['name', 'category']
				});
				const results = fuse.search(typing);
				return interaction.respond(results.map((i) => ({ name: `${i.item.category}: ${i.item.name}`, value: i.item.path })).slice(0, 25));
			}

			default: {
				return;
			}
		}
	}

	public renderComponents(setting: Setting, isDisabled: boolean = false) {
		const resetButton = new ButtonBuilder()
			.setCustomId('settings/resetToDefault')
			.setLabel('Reset to default')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(isUndefined(setting.default) || isDisabled);

		const baseButtonActionRow = new ActionRowBuilder<ButtonBuilder>().setComponents([resetButton]);
		const baseSelectMenuActionRow = new ActionRowBuilder<SelectMenuBuilder>();

		if (setting.isInputtable()) {
			const setNewValueButton = new ButtonBuilder()
				.setCustomId('settings/setNewValue')
				.setLabel('Set new value')
				.setStyle(ButtonStyle.Primary)
				.setDisabled(isDisabled);
			baseButtonActionRow.setComponents([setNewValueButton, resetButton]);
		}

		if (setting.isChoices()) {
			const choiceMenu = new SelectMenuBuilder()
				.setCustomId('settings/menu')
				.setMaxValues(1)
				.setMinValues(1)
				.setPlaceholder('Choose an option...')
				.setOptions(setting.options.map((option) => ({ label: option.name, value: String(option.value) })))
				.setDisabled(isDisabled);
			baseSelectMenuActionRow.setComponents([choiceMenu]);
		}

		if (setting.isBoolean()) {
			const toggleButton = new ButtonBuilder().setCustomId('settings/toggle').setLabel('Toggle');
			baseButtonActionRow.setComponents([toggleButton, resetButton]);
		}

		return baseSelectMenuActionRow.components.length ? [baseSelectMenuActionRow, baseButtonActionRow] : [baseButtonActionRow];
	}

	public renderEmbed(setting: Setting, dynamicValue: DynamicValueOption) {
		const isParagraph = (setting.isString() || setting.isImage()) && setting.format.style === TextInputStyle.Paragraph;

		const { group, currentValue, errorMessage } = dynamicValue;
		const inline = true;

		const embed = new EmbedBuilder()
			.setDescription(setting.description || 'No description available.')
			.setAuthor({ name: `in: ${setting.category}` })
			.setTitle(`${setting.category}: ${setting.name}`)
			.setFooter({
				text: `Currently setting: '@${group.tag}'. Option type: '${setting.type}'.`
			});

		// Displaying default value.
		if (!isUndefined(setting.default)) {
			embed.addFields([{ name: 'Default value', value: this._formatNullable(setting.default, !isParagraph), inline }]);
		}

		// Displaying current value
		if (!isUndefined(currentValue)) {
			embed.addFields([
				{
					name: 'Current value',
					value: this._formatNullable(currentValue, !isParagraph),
					inline
				}
			]);
		}

		if (setting.isImage()) {
			embed[setting.format.preview](currentValue);
		}

		if (setting.isChoices()) {
			embed.spliceFields(0, 0, {
				name: 'Available options',
				value: setting.options
					.map(
						(e) =>
							`> **${e.name}** (${Formatters.inlineCode(String(e.value))})\n${
								e.description?.length ? e.description : 'No description provided.'
							}`
					)
					.join(`\n\n`)
			});
		}

		// Display error message.
		if (errorMessage)
			embed.addFields([
				{
					name: '\u200b',
					value: `\n\n⚠ **ValidationError:** ${errorMessage}`
				}
			]);

		return embed;
	}

	private _formatNullable(value: any, format: boolean = true) {
		let result;

		if (format) result = Formatters.inlineCode(value);

		if (isUndefined(value) || isNull(value) || (!isNumber(value) && isEmpty(value))) {
			result = 'Not set'
		}
		return String(result ?? value);
	}

	public async getNewValue(options: HandlerOption) {
		const { setting, interaction, data } = options;

		if (!setting.isInputtable()) return;

		const modalId = interaction.id;
		const textField = this.renderTextField(setting as StringSetting | ImageSetting).setValue(String(data[setting.path]) ?? '');
		const modal = this.renderModal([textField], setting as StringSetting | ImageSetting).setCustomId(modalId);

		await interaction.showModal(modal);

		try {
			const modalInteraction = await interaction.awaitModalSubmit({ time: 999_000, filter: Constants.BaseModalFilter(interaction, modalId) });

			const newValue = modalInteraction.fields.getTextInputValue('concord:settings/textInput');

			return {
				interaction: modalInteraction,
				newValue: newValue
			};
		} catch {
			return;
		}
	}

	public async updateGroup(options: Omit<HandlerOption, 'interaction'> & { newValue: any }) {
		const { data, group, setting } = options;

		const result = await this.validateValue(options);

		if (!isOk(result)) {
			return result;
		}

		data[setting.path] = result.value;
		group.edit(Util.unflatten(data));

		return result;
	}

	public async validateValue(options: Pick<HandlerOption, 'setting' | 'group'> & { newValue: any }) {
		const { newValue, setting, group } = options;

		if (setting.isChoices() || setting.isInputtable()) {
			//@ts-expect-error
			return await setting.validate(newValue, group);
		} else {
			return ok(newValue);
		}
	}

	public renderTextField(setting: StringSetting | ImageSetting) {
		const textField = new TextInputBuilder()
			.setCustomId(`concord:settings/textInput`)
			.setLabel('New value')
			.setStyle(setting.format.style)
			.setRequired(!setting.nullable);

		if (setting.isString()) {
			const { maxLength, minLength } = setting.restraints;
			return textField.setMinLength(minLength).setMaxLength(maxLength);
		}
		if (setting.isNumber()) {
			const { maxValue, minValue } = setting.restraints

			const maxLength = maxValue === Infinity ? String(Number.MAX_SAFE_INTEGER).length - 1 : String(maxValue).length
			const minLength = minValue === -Infinity ? String(Number.MIN_SAFE_INTEGER).length - 1 : String(minValue).length

			return textField.setMinLength(minLength).setMaxLength(maxLength)
		}

		return textField;
	}

	public renderModal(components: TextInputBuilder[], setting: StringSetting | ImageSetting) {
		const actionRow = new ActionRowBuilder<TextInputBuilder>().setComponents(components);

		return new ModalBuilder().setTitle(`${setting.category}: ${setting.name}`).setComponents([actionRow]);
	}
}

type DynamicValueOption = {
	group: Group;
	errorMessage?: string;
	currentValue?: any;
};
type HandlerOption = Omit<GroupUpdateOptions, 'value'>;
interface GroupUpdateOptions {
	value: string | boolean | number | null;
	group: Group;
	data: { [key: string]: any };
	setting: Setting;
	interaction: MessageComponentInteraction;
}
