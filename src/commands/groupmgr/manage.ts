import { ActionRowBuilder } from '@discordjs/builders';
import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder, SelectMenuBuilder } from 'discord.js';
import { upperFirst } from 'lodash';
import { Command, Error, Group } from '../../structures';
import { Constants } from '../../typings/constants';

export class ManageCommand extends Command {
	constructor() {
		super({
			data: {
				name: 'manage',
				description: 'Manage various attibutes of your group.',
				options: [
					{
						name: 'channels',
						description: 'Manage channel members of your group.',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'target-group',
								description: 'The group you wanna manage.',
								type: ApplicationCommandOptionType.String,
								required: true,
								autocomplete: true
							}
						]
					},
					{
						name: 'requests',
						description: 'Manage requests of your group.',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'target-group',
								description: 'The group you wanna manage.',
								type: ApplicationCommandOptionType.String,
								required: true,
								autocomplete: true
							}
						]
					}
				]
			}
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		const subcommand = interaction.options.getSubcommand(true);
		await interaction.deferReply();

		type Subcommand = 'Channels' | 'Requests';

		const groupInput = interaction.options.getString('target-group', true);

		const group = interaction.client.groups.fetch(groupInput);
		if (!group) throw new Error('NON_EXISTENT_RESOURCE', Group.name, groupInput);
		this[`handle${upperFirst(subcommand) as Subcommand}`](interaction, group);
		return;
	}

	public async handleChannels(interaction: ChatInputCommandInteraction<'cached'>, group: Group) {
		const baseSelectMenu = new SelectMenuBuilder()
			.setOptions(
				group.channels.cache.map((i) => ({
					label: `${i.channel.guild.name} | #${i.channel.name}`,
					value: i.channelId
				}))
			)
			.setCustomId('concord:manage/ChannelList')
			.setMaxValues(1)
			.setMinValues(1);

		const message = await interaction.editReply({ components: [new ActionRowBuilder<SelectMenuBuilder>().setComponents([baseSelectMenu])] });

		const collector = message.createMessageComponentCollector({ idle: 20000, filter: Constants.BaseFilter(interaction) });

		collector.on('collect', (i) => {
			if (i.isSelectMenu()) {
				//@ts-expect-error
				const channelId = i.values[0];
			} else if (i.isButton()) {
			}
		});
		return;
	}

	public handleRequests(interaction: ChatInputCommandInteraction<'cached'>, group: Group) {
		const baseEmbed = new EmbedBuilder().setTitle('Requests Manager').setFooter({ text: `Currently managing: ${group}` });

		const requests = group.requests.cache.map((i) => ({
			name: `${i.channel.guild.name} | #${i.channel.name}`,
			value: `Message: ${i.message ?? 'Empty'}`
		}));

		baseEmbed.addFields(requests);

		interaction.editReply({ embeds: [baseEmbed] });
	}

	public override async autocompleteRun(interaction: AutocompleteInteraction<'cached'>) {
		const focusedValue = interaction.options.getFocused(true);
		const name = focusedValue.name;
		const value = String(focusedValue.value);

		if (name === 'target-group') {
			const coll = interaction.client.groups.cache.filter((i) => i.ownerId === interaction.user.id);

			return interaction.respond(
				coll
					.filter((i) => i.tag.startsWith(value))
					.map((e) => ({ name: e.tag, value: e.id }))
					.sort()
			);
		}
	}
}
