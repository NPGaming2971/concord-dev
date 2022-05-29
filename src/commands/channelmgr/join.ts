import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction } from 'discord.js';
import { Command, GroupEmbedModal } from '../../structures/';
import { Util } from '../../utils/';

export class JoinCommand extends Command {
	constructor() {
		super({
			data: {
				name: 'join',
				description: 'Join a group.',
				options: [
					{
						name: 'target-group',
						description: 'The id or the tag of the group you want to join.',
						type: ApplicationCommandOptionType.String,
						required: true
					},
					{
						name: 'channel',
						description: 'The channel to execute this command in. Defaults to this channel.',
						type: ApplicationCommandOptionType.Channel
					}
				]
			},
			preconditions: {
				canRunIn: [ChannelType.GuildText, ChannelType.GuildNews],
				requiredUserPermissions: ['ManageChannels'],
				
			},
		});
	}
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>): Promise<any> {
		const channel = interaction.options.getChannel('channel', true) ?? interaction.channel

		if (!channel.isRegisterable()) return

		const targetGroup = interaction.options.getString('target-group', true);
		await interaction.deferReply();
		const group = interaction.client.groups.cache.find((i) => i.tag === targetGroup);

		if (!group) return interaction.editReply('No such group');

		const registry = channel.fetchRegistry();

		if (!registry) return interaction.editReply('This channel is not registered.');

		const myGroup = registry.groupId ? interaction.client.groups.fetch(registry.groupId) : null;

		if (myGroup?.tag === group.tag) return interaction.editReply('You are already in this group.');

		let response = myGroup ? `Are you sure you want to leave ${myGroup} and join ${group}?` : 'Are you sure want to join this group?';

		const defaultOptions = {
			embeds: [],
			components: []
		};

		Util.startPrompt(
			interaction,
			{ content: response, embeds: [new GroupEmbedModal(group).default] },
			{
				allow: () => {
					group.channels.add(channel);
					myGroup?.channels.kick(channel);
					interaction.editReply({ content: `Joined ${group}.`, ...defaultOptions });
				},
				deny: () => {
					interaction.editReply({ content: 'Action cancelled.', ...defaultOptions });
				}
			}
		);
	}
}
