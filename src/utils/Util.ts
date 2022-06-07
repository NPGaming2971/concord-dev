import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	InteractionReplyOptions,
	InteractionUpdateOptions,
	WebhookClient
} from 'discord.js';
import fetch from 'node-fetch';
import { Constants } from '../typings/constants';
import type { Pagination } from './Pagination';

export class Util {
	private static Buttons = {
		first: new ButtonBuilder().setCustomId('concord:pagination/first').setLabel('First').setStyle(ButtonStyle.Primary),
		prev: new ButtonBuilder().setCustomId('concord:pagination/previous').setLabel('Previous').setStyle(ButtonStyle.Primary),
		index: new ButtonBuilder().setCustomId('concord:pagination/index').setLabel('0/0').setStyle(ButtonStyle.Secondary).setDisabled(true),
		next: new ButtonBuilder().setCustomId('concord:pagination/next').setLabel('Next').setStyle(ButtonStyle.Primary),
		last: new ButtonBuilder().setCustomId('concord:pagination/last').setLabel('Last').setStyle(ButtonStyle.Primary)
	};

	public static getProperty(object: any, prop: string) {
		if (typeof object !== 'object') throw 'getProperty: obj is not an object';
		if (typeof prop !== 'string') throw 'getProperty: prop is not a string';

		prop = prop.replace(/\[["'`](.*)["'`]\]/g, '.$1');

		return prop.split('.').reduce(function (prev, curr) {
			return prev ? prev[curr] : undefined;
		}, object || self);
	}

	public static get pagiationRow() {
		const { first, prev, index, next, last } = this.Buttons;

		return new ActionRowBuilder<ButtonBuilder>().setComponents([first, prev, index, next, last]);
	}

	public static renderRow<T>(pagination: Pagination<T>) {
		const { first, prev, next, last } = this.Buttons;
		const disablePrev = pagination.currentIndex === 0;
		const disableNext = pagination.maxPagesIndex === pagination.currentIndex;

		[first, prev].map((i) => i.setDisabled(disablePrev));
		[next, last].map((i) => i.setDisabled(disableNext));
	}

	static updateIndex(pagination: Pagination<any>) {
		this.Buttons.index.setLabel(pagination.getIndex().join('/'));
	}

	static handlePagination<T>(interaction: ButtonInteraction, pagination: Pagination<T>, updateOptionsOverwrite: (pagination: Pagination<T>) => InteractionUpdateOptions = () => ({})) {
		switch (interaction.customId) {
			case 'concord:pagination/previous':
				pagination.previousPage();
				break;
			case 'concord:pagination/next':
				pagination.nextPage();
				break;
			case 'concord:pagination/first':
				pagination.firstPage();
				break;
			case 'concord:pagination/last':
				pagination.lastPage();
				break;
		}

		this.renderRow(pagination);
		this.updateIndex(pagination);

		interaction.update({ embeds: pagination.getCurrentPage(), components: [this.pagiationRow], ...updateOptionsOverwrite(pagination) });
	}

	static isFunction(input: unknown): input is Function {
		return typeof input === 'function';
	}

	static isString(input: unknown): input is string {
		return typeof input === 'string';
	}
	static stringTemplateParser(expression: string, valueObj: { [key: string]: string }) {
		const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
		let text = expression.replace(templateMatcher, (_substring, value, _index) => {
			value = valueObj[value];
			return value;
		});
		return text;
	}

	static escapeQuote(text: string) {
		return text.replaceAll('>', '\u200B>');
	}

	static escapeMaskedLink(text: string) {
		const regex = /\[[a-z]+\]\([a-z]+\)/gi;

		const matches = text.match(regex)?.map((i) => [i, i.replace('](', ']\u200B(')]) ?? [];

		for (const [key, value] of matches) {
			text = text.replaceAll(key, value);
		}

		return text;
	}

	static fallback<K, R>(nullishValue: K, fallbackValue: R): Exclude<any, undefined> {
		return typeof nullishValue === 'undefined' ? fallbackValue : nullishValue;
	}

	static containsDuplicatedItem(array: any[]) {
		return new Set(array).size !== array.length;
	}

	static destructureWebhookURL(url: string) {
		const client = new WebhookClient({ url: url });

		const { id, token } = client;

		client.destroy();

		return { id, token };
	}
	static sizeOf(bytes: number) {
		if (bytes == 0) {
			return '0.00 B';
		}
		const e = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + ' KMGTP'.charAt(e) + 'B';
	}

	static flatten(obj: GeneralObject, roots = [], sep = '.'): GeneralObject {
		return Object.keys(obj).reduce(
			(memo, prop) =>
				Object.assign(
					{},
					memo,
					Object.prototype.toString.call(obj[prop]) === '[object Object]'
						? Util.flatten(obj[prop], roots.concat([prop] as any), sep)
						: { [roots.concat([prop] as any).join(sep)]: obj[prop] }
				),
			{}
		);
	}

	static unflatten(obj: GeneralObject) {
		let result = {};
		for (let i in obj) {
			let keys = i.split('.');
			keys.reduce((r: GeneralObject, e, j) => {
				return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 == j ? obj[i] : {}) : []);
			}, result);
		}
		return result;
	}

	static get promptRow() {
		return new ActionRowBuilder<ButtonBuilder>().setComponents([
			new ButtonBuilder().setCustomId('concord:startPrompt/confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('concord:startPrompt/cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
		]);
	}

	static async startPrompt(
		interaction: ChatInputCommandInteraction<'cached'>,
		options: InteractionReplyOptions,
		allow: (i: ButtonInteraction) => any,
		deny: (i: ButtonInteraction) => any
	) {
		const message = await interaction[interaction.replied ? 'followUp' : 'editReply']({
			...options,
			components: [...(options.components ?? []), this.promptRow],
			fetchReply: true
		});

		message
			.awaitMessageComponent({ filter: Constants.BaseFilter(interaction), componentType: ComponentType.Button, idle: 15000 })
			.then((i) => {
				this.handlePromptCollect(i, allow, deny);
			})
			.catch((err) => {
				console.log(err)
				message.edit({
					components: [],
					embeds: [],
					content: 'No response received. Action cancelled.'
				});
			});
	}

	public static handlePromptCollect(
		interaction: ButtonInteraction<'cached'>,
		allow: (interaction: ButtonInteraction<'cached'>) => any,
		deny: (interaction: ButtonInteraction<'cached'>) => any
	) {
		switch (interaction.customId) {
			case 'concord:startPrompt/confirm':
				allow(interaction);
				break;
			case 'concord:startPrompt/cancel':
				deny(interaction);
				break;
		}
	}

	public static async isImage(url: string): Promise<boolean> {
		try {
			const res = await fetch(url);
			const buff = await res.blob();
			console.log(buff.type);
			return buff.type.startsWith('image/');
		} catch (err) {
			console.log(err);
			return false;
		}
	}
}
type GeneralObject = { [key: string | number | symbol]: any };
