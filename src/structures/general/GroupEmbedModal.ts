import { EmbedBuilder, EmbedData, Formatters } from 'discord.js';
import type { APIEmbed } from 'discord.js';
import type { Group } from './Group';
import { GroupStatusType } from '../../typings/enums';
import { isBoolean } from 'lodash';

export class GroupEmbedModal extends EmbedBuilder {
	public group: Group;
	constructor(group: Group, data?: EmbedData | APIEmbed) {
		super(data);
		this.group = group;
	}

	public showLocale(isPrivate: boolean = false) {
		return this.addFields([{ name: 'Locale', value: isPrivate ? 'N/A' : this.group.displayLocale()! , inline: true }]);
	}

	public showName(isPrivate: boolean = false) {
		return this.setTitle(isPrivate ? 'Unknown' : this.group.displayName());
	}

	public showOwner(isPrivate: boolean = false) {
		return this.addFields([
			{
				name: 'Owner',
				value: isPrivate ? 'N/A' : Formatters.userMention(this.group.ownerId),
				inline: true
			}
		]);
	}

	public showCreationTime() {
		return this.addFields([
			{
				name: 'Created at',
				value: `<t:${Math.round(this.group.createdTimestamp / 1000)}>`,
				inline: true
			}
		]);
	}

	public showDescription(isPrivate: boolean = false) {
		return this.setDescription(isPrivate ? 'Unable to load description.' : this.group.displayDescription());
	}

	public showAvatar(isPrivate: boolean = false) {
		return this.setThumbnail(isPrivate ? null : this.group.displayAvatarURL());
	}
	public showBanner(isPrivate: boolean = false) {
		return this.setImage(isPrivate ?  null : this.group.displayBannerURL());
	}

	public showId() {
		return this.setFooter({
			text: `ID: ${this.group.id}`
		});
	}

	public showTag() {
		return this.addFields([
			{
				name: 'Group Tag',
				value: Formatters.inlineCode('@' + this.group.tag),
				inline: true
			}
		]);
	}

	public showMemberCount(isPrivate: boolean = false) {
		return this.addFields([
			{
				name: 'Members',
				value: isPrivate ? 'N/A' : `${this.group.channels.cache.size}/${this.group.channelLimit}`,
				inline: true
			}
		]);
	}

	public showStatus() {
		return this.addFields([
			{
				name: 'Status',
				value: this.group.status,
				inline: true
			}
		]);
	}

	public showMultiple(propertyArray: GroupEmbedModalProperty[], isPrivate: Partial<Record<GroupEmbedModalProperty, boolean>> | boolean = {}) {
		propertyArray.forEach((e) =>
			this[`show${e}`](isBoolean(isPrivate) ? isPrivate : isPrivate[e] ?? this.group.status === GroupStatusType.Private)
		);
		return this;
	}

	public default(isPrivate: Partial<Record<GroupEmbedModalProperty, boolean>> | boolean = {}) {
		return new GroupEmbedModal(this.group).showMultiple(
			['Avatar', 'Banner', 'CreationTime', 'MemberCount', 'Name', 'Tag', 'Owner', 'Id', 'Description', 'Locale', 'Status'],
			isPrivate
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
