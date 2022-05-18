import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction } from 'discord.js';
import { ResponseFormatters, Command, CooldownScope } from '../../structures/';
import type { RegisterableChannel } from '../../typings';
import { Time } from '../../typings/enums';

export class RegisterCommand extends Command {
	constructor() {
		super({
			data: {
				name: 'register',
				description: 'Register a channel to be ready to connect to Concord group.',
				options: [
					{
						name: 'channel',
						description: 'The channel to register [default: the channel you are running this on].',
						type: ApplicationCommandOptionType.Channel,
						channelTypes: [ChannelType.GuildText, ChannelType.GuildNews]
					},
					{
						name: 'force-create-new',
						description: 'Force Concord to create a new webhook instead of reusing existing webhook [default: false].',
						type: ApplicationCommandOptionType.Boolean
					}
				]
			},
			preconditions: {
				canRunIn: [ChannelType.GuildText, ChannelType.GuildNews],
				requiredClientPermissions: ['ManageWebhooks'],
				requiredUserPermissions: ['ManageChannels']
			},
			restraints: {
				cooldowns: {
					delay: Time.Minute * 5,
					scope: CooldownScope.Guild
				},
			}
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction<'cached'>) {
		const channel = (interaction.options.getChannel('channel') as RegisterableChannel) ?? interaction.channel;

		const forceCreateNew = interaction.options.getBoolean('force-create-new') ?? false;

		await interaction.deferReply();

		const { prepareError } = ResponseFormatters;
		if (!channel?.permissionsFor(interaction.guild.me!)?.has('ManageWebhooks'))
			return interaction.editReply(prepareError('MISSING_CLIENT_PERMISSIONS', { permissions: 'ManageWebhooks' }));

		if (interaction.client.registry.fetch(channel)) {
			return interaction.editReply('This channel is already set up.');
		}

		const webhooks = (await channel.fetchWebhooks()).filter((e) => e.owner?.id === interaction.client.user?.id);

		if (webhooks.size !== 0 || !forceCreateNew) {
			const [passed, failed] = webhooks.partition((e) => e.id === webhooks.first()?.id);

			if (!passed.size) return createWebhook();

			interaction.client.registry.create({ channel, url: passed.first()!.url, groupId: null });

			failed.map((e) => e.delete());

			interaction.editReply(`Successfully registered this channel. Now it's ready to connect to any Concord groups.`);
		} else createWebhook();

		return;

		function createWebhook() {
			channel
				.createWebhook('Concord', { reason: `Requested by ${interaction.user.tag}` })
				.then(async (webhook) => {
					webhook.client.registry.create({ channel, url: webhook.url, groupId: null });
					interaction.editReply("Successfully registered this channel. Now it's ready to connect to any Concord groups.");
				})
				.catch((_) => interaction.editReply('An error occured.'));
		}
	}
}
