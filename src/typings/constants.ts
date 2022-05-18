import { type Interaction, Message, ButtonInteraction } from 'discord.js';

export const Constants = {
	ClientId: '905467890982084638',
	DefaultColor: 0x5e92cc,
	DevelopmentGuildId: ['755892553827483799', '847874027149721680'],
	Administrators: ['792645340632317992'],
	BaseFilter: (interaction: Interaction<'cached'> | Message) => async (i: ButtonInteraction) => {

        let author
        if (interaction instanceof Message) {
            author = interaction.author.id
        } else {
            author = interaction.user.id
        }
		await i.deferUpdate();
		if (i.user.id === author) return true;
		else {
			i.followUp({ content: 'Not your menu.', ephemeral: true });
			return false;
		}
	},
	Emojis: {
		Image: '919224853809221712',
		Attachment: '955764107997491261'
	}
};
