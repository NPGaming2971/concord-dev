import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction, Locale } from 'discord.js';
import { Command, GroupEmbedModal } from '../../structures/';
import Fuse from 'fuse.js';
import { Pagination } from '../../utils/Pagination';
import type { EmbedBuilder } from '@discordjs/builders';
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
		this.data.options?.map((i) => i.name);

		const queryingOptions = {
			query: options.getString('query'),
			ownerId: options.getString('owner'),
			locale: options.getString('locale'),
			status: options.getString('status'),
			range: options.getString('range') ?? '0-25'
		};

		const { query, locale, status, range } = queryingOptions;

		let initial = interaction.client.groups.cache.toJSON();

		if (status) {
			initial = initial.filter((e) => e.status === status);
		}

		if (locale) {
			initial = initial.filter((e) => e.locale === locale);
		}
		initial = initial.filter((e) => {
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
			const fuse = new Fuse(initial, {
				keys: ['tag'],
				includeScore: true
			});
			const results = fuse.search(query);

			initial = results.map((i) => i.item);
		}

		if (!initial.length) {
			return interaction.editReply('No result was found. Did you apply too many filters?');
		}
		const pagination = new Pagination<EmbedBuilder>({
			pages: initial.map((i) =>
				new GroupEmbedModal(i).showMultiple(['Avatar', 'Banner', 'MemberCount', 'Description', 'Name', 'Status', 'Tag'])
			),
			splitInto: 3
		});

		interaction.editReply({
			content: `${initial.length} results found.`,
			embeds: pagination.getPage(0)
		});

		return;
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

				console.log(results.length);

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
