import { ActionRowBuilder, Attachment, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';
import { pick } from 'lodash';
import type { ChannelRegistry, Group } from '../structures';
import { Constants } from '../typings/constants';

const Buttons = {
	sendAsFile: new ButtonBuilder().setLabel('Send as a file').setStyle(ButtonStyle.Primary).setCustomId('concord:message/sendAsFile'),
	cutDownContent: new ButtonBuilder()
		.setLabel('Cut down content to 2000 characters')
		.setStyle(ButtonStyle.Danger)
		.setCustomId('concord:message/cutDown'),
	doNothing: new ButtonBuilder().setLabel('Do nothing (15s)').setStyle(ButtonStyle.Danger).setCustomId('concord:message/cancel')
};

export class ConditionHandler {
	static async handleExceedingLength(message: Message, group: Group, registry: ChannelRegistry) {
		const buttonsRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
			Object.values(pick(Buttons, ['sendAsFile', 'cutDownContent', 'doNothing']))
		);

		const msg = await message.reply({
			content: 'Your message exceeded the 2000 characters limit.\nPlease choose a method to proceed.',
			components: [buttonsRow]
		});
		try {
			const collected = await msg.awaitMessageComponent({
				filter: Constants.BaseFilter(message),
				componentType: ComponentType.Button,
				idle: 15000
			});

			if (collected.customId === 'concord:message/cancel') {
			}

			if (collected.customId === 'concord:message/sendAsFile') {
				const buffer = Buffer.from(message.content);

				const attachment = new Attachment(buffer, 'message.txt');

				group.send({ original: message, exclude: [registry], files: [attachment], content: null });
			}

			msg.delete();
		} catch (e) {}
	}
}
