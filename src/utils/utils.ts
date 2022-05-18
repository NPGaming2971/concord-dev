import { WebhookClient } from 'discord.js';

export class Util {
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

	static flatten(obj: {[key: string]: any}) {
		let result: {[key: string]: any} = {};
	
		for (const i in obj) {
			if (typeof obj[i] === "object" && !Array.isArray(obj[i])) {
				const temp = Object(obj[i]);
				for (const j in temp) {
					result[i + "." + j] = temp[j];
				}
			} else {
				result[i] = obj[i];
			}
		}
		return result;
	};

	static unflatten(obj: {[key: string]: any}) {
		let result = {}
		for (let i in obj) {
		  let keys = i.split('.')
		  keys.reduce((r, e, j) => {
			  //@ts-expect-error
			return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 == j ? obj[i] : {}) : [])
		  }, result)
		}
		return result
	  }
}
