import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Locale
} from 'discord.js';
import { Command, GroupEmbedModal } from '../../structures/';
import Fuse from 'fuse.js';
import { Pagination } from '../../utils/Pagination';
import { Constants } from '../../typings/constants';
import { sampleSize } from 'lodash';
import { Util } from '../../utils';
import { SelectMenuBuilder } from '@discordjs/builders';
import { GroupStatusType } from '../../typings/enums';

export class CreateCommand extends Command {
	constructor() {
		super({
			data: {
				name: 'search',
				description: 'Search for a group.',
				options: [
					{
						name: 'query',
						description: 'The tag of the group to search.',
						type: ApplicationCommandOptionType.String
					},
					{
						name: 'limit',
						description: 'The number of groups to query [Default: 50]',
						type: ApplicationCommandOptionType.Number,
						maxValue: 100,
						minValue: 1
					},
					{
						name: 'locale',
						description: "The locale of the groups to search. Default to any. Set this to 'none' to stop this behavior.",
						type: ApplicationCommandOptionType.String,
						autocomplete: true
					},
					{
						name: 'owner',
						description: 'The owner id of the target groups.',
						type: ApplicationCommandOptionType.String
					},
					{
						name: 'status',
						description: "The status of the target groups. 'All' if not specified.",
						type: ApplicationCommandOptionType.String,
						choices: [
							{
								name: 'Public',
								value: 'public'
							},
							{
								name: 'Restricted',
								value: 'restricted'
							},
							{
								name: 'Protected',
								value: 'protected'
							},
							{
								name: 'Private',
								value: 'private'
							}
						]
					},
					{
						name: 'range',
						description: "The member range of the target groups [format: 'min-max'] [example: '0-25'] [default: 0-25]",
						type: ApplicationCommandOptionType.String
					}
				]
			}
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		await interaction.deferReply();
		const { options } = interaction;

		const queryingOptions = {
			query: options.getString('query'),
			ownerId: options.getString('owner'),
			locale: options.getString('locale'),
			status: options.getString('status'),
			range: options.getString('range') ?? '0-25',
			limit: options.getNumber('limit') ?? 50
		};

		const { query, locale, status, range } = queryingOptions;

		let result = interaction.client.groups.cache.toJSON();

		if (status) {
			result = result.filter((e) => e.status === status);
		}

		if (locale) {
			result = result.filter((e) => e.locale === locale);
		}

		result = result.filter((e) => {
			const number = e.channels.cache.size;
			const arr = range.split('-').map((i) => Number(i));
			if (arr.length < 2) {
				arr.length = 0;
				arr.push(0, 25);
			}
			arr[0] < 0 ? (arr[0] = 0) : void 0;
			arr[1] > 25 ? (arr[1] = 25) : void 0;
			return number <= arr[1] && number >= arr[0];
		});

		if (query) {
			const fuse = new Fuse(result, {
				keys: ['tag'],
				includeScore: true
			});
			const results = fuse.search(query);

			result = results.map((i) => i.item);
		} else {
			result = sampleSize(result, queryingOptions.limit);
		}

		if (!result.length) {
			return interaction.editReply('No result was found. Did you apply too many filters?');
		}
		const pagination = new Pagination<GroupEmbedModal>({
			pages: result.map((i) =>
				new GroupEmbedModal(i).showMultiple(
					['Avatar', 'MemberCount', 'Description', 'Name', 'Status', 'Tag'],
					i.status === GroupStatusType.Private && !(i.ownerId === interaction.user.id)
				)
			),
			groupBy: 3
		});

		const resultString = `${result.length} result${result.length === 1 ? '' : 's'} found.`;

		const message = await interaction.editReply({
			content: resultString,
			embeds: pagination.getPage(0),
			components: [this.renderGroupSelectMenu(pagination), Util.pagiationRow]
		});

		const collector = message.createMessageComponentCollector({
			filter: Constants.BaseFilter(interaction),
			idle: 20000
		});

		collector.on('collect', (i) => {
			if (i.isSelectMenu()) {
				if (i.customId !== 'concord:search/select') return;

				const groupId = i.values[0];
				const group = i.client.groups.fetch(groupId)!;
				const backButton = new ButtonBuilder().setCustomId('concord:search/back').setLabel('Back').setStyle(ButtonStyle.Secondary);

				i.update({
					content: null,
					embeds: [new GroupEmbedModal(group).default(group.status === GroupStatusType.Private && !(group.ownerId === interaction.user.id))],
					components: [new ActionRowBuilder<ButtonBuilder>().setComponents([backButton])]
				});
			}

			if (i.isButton()) {
				
				if (i.customId === 'concord:search/back') {
					i.update({
						content: resultString,
						components: [this.renderGroupSelectMenu(pagination), Util.pagiationRow],
						embeds: pagination.getCurrentPage()
					});
					return
				}
				Util.handlePagination(i, pagination, (p) => ({ components: [this.renderGroupSelectMenu(p), Util.pagiationRow]}));
			}
		});

		return;
	}

	private renderGroupSelectMenu(pagination: Pagination<GroupEmbedModal>) {
		const currPage = pagination.getCurrentPage();

		return new ActionRowBuilder<SelectMenuBuilder>().setComponents([
			new SelectMenuBuilder()
				.setOptions(currPage.map(i => ({ label: `${i.data.title! ?? 'Unnamed'} (@${i.group.tag})`, value: i.group.id })))
				.setCustomId('concord:search/select')
				.setMaxValues(1)
				.setMinValues(1)
				.setPlaceholder('Choose a group to view its info.')
		]);
	}

	public override async autocompleteRun(interaction: AutocompleteInteraction) {
		const focusedValue = interaction.options.getFocused(true);
		switch (focusedValue.name) {
			case 'locale':
				const arr = Object.entries(Locale).map(([a, b]) => ({ key: a, value: b }));
				const fuse = new Fuse(arr, {
					shouldSort: true,
					keys: ['key', 'value']
				});

				const results = fuse.search(focusedValue.value.toString());

				const choices = results
					.map((i) => (i.score! < 0.01 ? { ...i.item, key: `⭐ ${i.item.key}` } : i.item))
					.map((e) => ({
						name: e.key,
						value: e.value
					}));
				interaction.respond(choices);
		}
	}
}
