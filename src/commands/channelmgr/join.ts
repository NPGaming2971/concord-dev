//TODO: refactor
import { ActionRowBuilder, TextInputBuilder } from '@discordjs/builders';
import { from, isOk } from '@sapphire/result';
import {
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ChatInputCommandInteraction,
	ComponentType,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputStyle
} from 'discord.js';
import { upperFirst } from 'lodash';
import { ChannelRegistry, Command, Error, Group, GroupEmbedModal, ResponseFormatters } from '../../structures/';
import { GroupRequest } from '../../structures/general/GroupRequest';
import type { Maybe, RegisterableChannel } from '../../typings';
import { Constants } from '../../typings/constants';
import { GroupStatusType, RequestState, RequestType, Time } from '../../typings/enums';
import { Util } from '../../utils/';
const { prepareError, appendEmojiToString } = ResponseFormatters;

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
						type: ApplicationCommandOptionType.Channel,
						channelTypes: [ChannelType.GuildNews, ChannelType.GuildText]
					}
				]
			},
			preconditions: {
				canRunIn: [ChannelType.GuildText, ChannelType.GuildNews],
				requiredUserPermissions: ['ManageChannels']
			}
		});
	}
	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>): Promise<any> {
		const channel = interaction.options.getChannel('channel')! ?? (interaction.channel as RegisterableChannel);

		if (!channel.isRegisterable()) return;

		const targetGroup = interaction.options.getString('target-group', true);
		await interaction.deferReply();
		const group = interaction.client.groups.cache.find((i) => i.tag === targetGroup || i.id === targetGroup);

		if (!group) throw new Error('NON_EXISTENT_RESOURCE', Group.name, targetGroup);

		const registry = channel.fetchRegistry();

		if (!registry)
			return interaction.editReply(
				appendEmojiToString(Constants.Emojis.Failure, 'This channel is not registered. Execute `/register` on this channel to register it.')
			);

		if (registry.group?.tag === group.tag)
			return interaction.editReply(appendEmojiToString(Constants.Emojis.Failure, `This channel is already in specified group.`));

		if (group.ownerId === interaction.user.id) {
			this.prompt(interaction, channel, group, registry.group);
			return;
		}

		type GroupType = Capitalize<keyof typeof GroupStatusType>;
		const options = { group, registry, interaction };
		this[`handle${upperFirst(group.status) as GroupType}`](options);
	}

	public prompt(interaction: ChatInputCommandInteraction<'cached'>, channel: RegisterableChannel, group: Group, myGroup: Maybe<Group>) {
		const defaultOptions = {
			embeds: [],
			components: []
		};
		const response = `Are you sure you want to ${myGroup ? `leave ${myGroup} and join ${group}` : 'join this group'}?`;

		Util.startPrompt(
			interaction,
			{ content: response, embeds: [new GroupEmbedModal(group).default(!(interaction.user.id === group.ownerId))] },

			(i) => {
				group.channels.add(channel);
				myGroup?.channels.kick(channel);
				i.update({ content: `\`✔️\` Joined ${group}.`, ...defaultOptions });
			},
			(i) => {
				i.update({ content: '`✔️` Action cancelled.', ...defaultOptions });
			}
		);
	}

	private handlePublic(options: HandleOptions) {
		const { group, interaction, registry } = options;

		this.prompt(interaction, registry.channel, group, registry.group);
	}

	private async handleRestricted(options: HandleOptions) {
		const { group, interaction, registry } = options;

		const editMessageRow = new ActionRowBuilder<ButtonBuilder>().setComponents([
			new ButtonBuilder().setCustomId('concord:join/editRequestMessage').setStyle(ButtonStyle.Primary).setLabel('Edit Request Message')
		]);

		const mockRequest = new GroupRequest(
			interaction.client,
			{ channelId: interaction.channelId, message: null, id: 'any', state: RequestState.Pending, type: RequestType.Connect },
			group.id
		);

		const messagePrompt = await interaction.editReply({
			content: 'You are about to send a request to this group. Are you sure about that?\nYou can edit the message of the request if you like.',
			components: [editMessageRow, Util.promptRow],
			embeds: [ResponseFormatters.renderRequest(mockRequest)]
		});

		const collector = messagePrompt.createMessageComponentCollector({
			componentType: ComponentType.Button,
			idle: 60000,
			filter: Constants.BaseFilter(interaction)
		});

		collector.on('collect', async (i) => {
			if (i.customId === 'concord:join/editRequestMessage') {
				const textInputField = new TextInputBuilder()
					.setCustomId('concord:join/editMessage')
					.setLabel('New request message')
					.setPlaceholder('I want to join your group!')
					.setStyle(TextInputStyle.Short);

				const modal = new ModalBuilder()
					.setComponents([new ActionRowBuilder<TextInputBuilder>().setComponents([textInputField])])
					.setTitle('Concord: Edit request message')
					.setCustomId(`concord:manage/requests/${i.id}`);

				i.showModal(modal);
				const modalInteraction = await i.awaitModalSubmit({ time: 999000, filter: Constants.BaseModalFilter(i, modal.data.custom_id!) });

				mockRequest.message = modalInteraction.fields.getTextInputValue('concord:join/editMessage');

				if (!modalInteraction.isFromMessage()) return;

				modalInteraction.update({ embeds: [ResponseFormatters.renderRequest(mockRequest)] });
			}

			const handleAllow = async (a: typeof i) => {
				await a.deferUpdate();
				const result = from<GroupRequest, Error>(() =>
					group.requests.create({ channel: registry.channel, type: RequestType.Connect, message: mockRequest.message ?? undefined })
				);

				if (isOk(result)) {
					interaction.editReply({ content: `\`✔️\` Successfully sent a request to ${group}!`, components: [], embeds: [] });
					collector.stop();
				} else {
					interaction.editReply(
						Object.assign(prepareError(result.error), {
							components: [],
							embeds: []
						})
					);
					collector.stop();
				}
			};

			const handleDeny = (a: typeof i) => {
				a.update({ content: '`✔️` Action cancelled.', components: [], embeds: [] });
			};

			Util.handlePromptCollect(i, handleAllow, handleDeny);
		});
	}

	private async handleProtected(options: HandleOptions) {
		const { group, interaction, registry } = options;

		const inputPasswordButton = new ButtonBuilder()
			.setCustomId('concord:join/passwordInput')
			.setStyle(ButtonStyle.Primary)
			.setLabel('Input Password');

		const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents([inputPasswordButton]);

		const message = await interaction.editReply({ content: 'This group requires a password for entrance.', components: [actionRow] });

		const collector = message.createMessageComponentCollector({
			filter: Constants.BaseFilter(interaction),
			componentType: ComponentType.Button,
			idle: 30000
		});

		collector.on('collect', async (i) => {
			const passwordInputField = new TextInputBuilder()
				.setPlaceholder('Input password here')
				.setLabel('Password')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setCustomId('concord:join/passwordInput');

			const actionRow = new ActionRowBuilder<TextInputBuilder>().setComponents([passwordInputField]);

			const modal = new ModalBuilder().setComponents([actionRow]).setTitle('Concord: Input Password').setCustomId(`concord:join/${i.id}`);

			i.showModal(modal);
			const filter = (m: ModalSubmitInteraction) => m.user.id === interaction.user.id && m.customId === `concord:join/${i.id}`;

			try {
				const modalInteraction = await i.awaitModalSubmit({ time: Time.Second * 999, filter });

				if (!modalInteraction.isFromMessage()) return;
				const passwordInput = modalInteraction.fields.getTextInputValue('concord:join/passwordInput');

				if (passwordInput === group.password) {
					modalInteraction.reply('Access authorized.').then(() => setTimeout(() => modalInteraction.deleteReply(), 3000).unref());

					collector.stop();
					this.prompt(interaction, registry.channel, group, registry.group);
					return;
				} else {
					modalInteraction.update('Incorrect password.');
					return;
				}
			} catch (_) {}
		});

		return false;
	}

	private handlePrivate(options: HandleOptions) {
		const { group, interaction } = options;

		if (interaction.user.id !== group.ownerId) {
			interaction.editReply('Can not join this group since it is private.');
		}
	}
}

type HandleOptions = {
	group: Group;
	registry: ChannelRegistry;
	interaction: ChatInputCommandInteraction<'cached'>;
};
