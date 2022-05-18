import {
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	ActionRowBuilder,
	SelectMenuBuilder,
	Formatters,
	MessageComponentInteraction,
	ModalSubmitInteraction,
	TextInputStyle,
	ModalBuilder,
	TextInputBuilder
} from 'discord.js';
import { Command, Group } from '../../structures/';
import Settings, { Setting } from '../../../assets/settings';
import Fuse from 'fuse.js';
import { Util } from '../../utils/utils';
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
						description: 'placeholder',
						type: ApplicationCommandOptionType.String,
						autocomplete: true
					}
				]
			}
		});
	}
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>): Promise<any> {
		await interaction.deferReply();

		const targetGroup = interaction.options.getString('target-group', true);
		const inputOptionName = interaction.options.getString('option-name');

		const option = Settings.find((i) => i.path === inputOptionName);

		if (!option) return interaction.editReply('No such option.');

		const group = interaction.client.groups.cache.get(targetGroup);
		if (!group) return interaction.editReply('No such group.');

		const groupData = Util.flatten(group.toJSON())
		const optionEmbed = parseOption(option, group)

		const embed = appendCurrentValue(optionEmbed, option.path, groupData)

		const response = await interaction.editReply({ embeds: [embed], components: renderComponents(option) });

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

		collector.on('collect', async (i) => {
			if (i.isSelectMenu()) {
			}

			if (i.isButton()) {
				if (i.customId === 'settings/setNewValue') {
					if (!option.isString()) return;

					const filter = (m: ModalSubmitInteraction) => m.user.id === i.user.id && m.customId === `concord:eval/${i.id}`;

					const textField = new TextInputBuilder().setCustomId(`textInput`).setStyle(TextInputStyle.Short).setLabel('New value');

					const modal = new ModalBuilder()
						.setComponents(new ActionRowBuilder<TextInputBuilder>().setComponents(textField))
						.setCustomId(`concord:settings/${i.id}`)
						.setTitle(`${option.help?.category ?? 'Unknown'}: ${option.name}`);

					i.showModal(modal)

					try {
						const modalInteraction = await i.awaitModalSubmit({ time: 999000, filter })

						//@ts-expect-error
						const newValue = modalInteraction.fields.getTextInputValue('textInput')

						

						
					} catch(_) {}
				}
			}
		});
	}

	public override autocompleteRun(interaction: AutocompleteInteraction) {
		const focusedValue = interaction.options.getFocused(true);

		const value = String(focusedValue.value);

		switch (focusedValue.name) {
			case 'option-name':
				if (!value.length) return interaction.respond(Settings.map((i) => ({ name: i.name, value: i.path })).slice(0, 25));

				const fuse = new Fuse(Settings, {
					keys: ['name'],
					includeScore: true,
					shouldSort: true
				});

				const results = fuse.search(value);

				return interaction.respond(results.map((i) => ({ name: i.item.name, value: i.item.path })).slice(0, 25));
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
}

function appendCurrentValue(embed: EmbedBuilder, settingPath: string, flattenedGroup: {[key: string]: any}) {
	return embed.spliceFields(2, 0, {
		name: 'Current value',
		value: String(flattenedGroup[settingPath]),
		inline: true
	})
}

function parseOption(option: Setting, group: Group) {
	const embed = new EmbedBuilder()
		.setAuthor({ name: `in: ${option.help?.category ?? 'Uncategorized'}` })
		.setDescription(option.description?.length ? option.description : 'No description provided.')
		.setTitle(`${option.help?.category ?? 'Unknown'}: ${option.name}`)
		.setFooter({
			text: `Currently setting: '@${group.tag}'. Option type: '${option.type}'.`
		})
		.addFields({
			name: 'Default value',
			value: Formatters.inlineCode(String(option.default)),
			inline: true
		});

	if (option.isChoices()) {
		embed.spliceFields(0, 0, {
			name: 'Available options',
			value: option.options
				.map(
					(e) =>
						`> **${e.name}** (${Formatters.inlineCode(e.value)})\n${e.description?.length ? e.description : 'No description provided.'}`
				)
				.join(`\n\n`)
		});
	}

	return embed;
}

function renderComponents(setting: Setting) {
	const resetButton = new ButtonBuilder().setCustomId('settings/resetToDefault').setLabel('Reset to default').setStyle(ButtonStyle.Secondary);

	const baseButtonActionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(resetButton);
	const baseSelectMenuActionRow = new ActionRowBuilder<SelectMenuBuilder>();

	if (setting.isString()) {
		const setNewValueButton = new ButtonBuilder().setCustomId('settings/setNewValue').setLabel('Set new value').setStyle(ButtonStyle.Primary);
		baseButtonActionRow.setComponents(setNewValueButton, resetButton);
	}

	if (setting.isBoolean()) {
		const toggleButton = new ButtonBuilder().setCustomId('settings/toggle').setLabel('Toggle').setStyle(ButtonStyle.Primary);
		baseButtonActionRow.setComponents(toggleButton, resetButton);
	}

	if (setting.isChoices()) {
		const choiceMenu = new SelectMenuBuilder()
			.setCustomId('settings/menu')
			.setMaxValues(1)
			.setMinValues(1)
			.setPlaceholder('Choose an option...')
			.setOptions(...setting.options.map((option) => ({ label: option.name, value: option.value })));

		baseSelectMenuActionRow.setComponents(choiceMenu);
	}
	return baseSelectMenuActionRow.components.length ? [baseSelectMenuActionRow, baseButtonActionRow] : [baseButtonActionRow];
}