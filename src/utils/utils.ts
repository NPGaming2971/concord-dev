import {
	Awaitable,
	WebhookClient
} from 'discord.js';
import { Logger } from '../classes/Logger';

export class Util {
	static isFunction(input: unknown): input is Function {
		return typeof input === 'function';
	}

	static isString(input: unknown): input is string {
		return typeof input === 'string';
	}

	static async fromAsync<T, E = unknown>(promiseOrCb: Awaitable<T> | ((...args: unknown[]) => Awaitable<T>)): Promise<T | E> {
		try {
			return await (this.isFunction(promiseOrCb) ? promiseOrCb() : promiseOrCb);
		} catch (error) {
			Logger.error('Error', error);
			return error as E;
		}
	}

	static stringTemplateParser(expression: string, valueObj: { [key: string]: string }) {
		const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
		let text = expression.replace(templateMatcher, (_substring, value, _index) => {
			value = valueObj[value];
			return value;
		});
		return text;
	}

	static fallback<K, R>(nullishValue: K, fallbackValue: R): any {
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
			return "0.00 B";
		}
		const e = Math.floor(Math.log(bytes) / Math.log(1024));
		return (
			(bytes / Math.pow(1024, e)).toFixed(2) + " " + " KMGTP".charAt(e) + "B"
		);
	};
}
