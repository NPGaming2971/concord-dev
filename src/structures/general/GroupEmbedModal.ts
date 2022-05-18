import { EmbedBuilder, EmbedData, Formatters } from 'discord.js';
import type { APIEmbed } from 'discord.js/node_modules/discord-api-types/v10';
import { GroupStatusType } from '../../typings/enums';
import type { Group } from './Group';

export class GroupEmbedModal extends EmbedBuilder {
	private group: Group;
	constructor(group: Group, data?: EmbedData | APIEmbed) {
		super(data);
		this.group = group;
	}

	public showLocale() {
		return this.addFields({ name: 'Locale', value: this.group.getLocale()!, inline: true });
	}

	public showName() {
		return this.setTitle(this.group.status === GroupStatusType.Private ? 'Unknown' : this.group.getName());
	}

	public showOwner() {
		return this.addFields({
			name: 'Owner',
			value: this.group.status !== GroupStatusType.Private ? Formatters.userMention(this.group.ownerId) : 'N/A',
			inline: true
		});
	}

	public showCreationTime() {
		return this.addFields({
			name: 'Created at',
			value: `<t:${Math.round(this.group.createdTimestamp / 1000)}>`,
			inline: true
		});
	}

	public showDescription() {
		return this.setDescription(this.group.status === GroupStatusType.Private ? 'Unable to load description.' : this.group.getDescription());
	}

	public showAvatar() {
		return this.setThumbnail(this.group.getAvatarURL());
	}
	public showBanner() {
		return this.setImage(this.group.getBannerURL());
	}

	public showId() {
		return this.setFooter({
			text: `ID: ${this.group.id}`
		});
	}

	public showTag() {
		return this.addFields({
			name: 'Group Tag',
			value: Formatters.inlineCode('@' + this.group.tag),
			inline: true
		});
	}

	public showMemberCount() {
		return this.addFields({
			name: 'Members',
			value: this.group.status !== GroupStatusType.Private ? `${this.group.channels.cache.size}/${this.group.channelLimit}` : 'N/A',
			inline: true
		});
	}

	public showStatus() {
		return this.addFields({
			name: 'Status',
			value: this.group.status,
			inline: true
		});
	}

	public showMultiple(...propertyArray: GroupEmbedModalProperty[]) {
		propertyArray.forEach((e) => this[`show${e}`]());
		return this;
	}

	get default() {
		return new GroupEmbedModal(this.group).showMultiple(
			'Avatar',
			'Banner',
			'CreationTime',
			'MemberCount',
			'Name',
			'Tag',
			'Owner',
			'Id',
			'Description',
			'Locale',
			'Status'
		);
	}
}

type GroupEmbedModalProperty =
	| 'Description'
	| 'Name'
	| 'Banner'
	| 'Avatar'
	| 'Id'
	| 'Owner'
	| 'MemberCount'
	| 'Tag'
	| 'Status'
	| 'Locale'
	| 'CreationTime';

	