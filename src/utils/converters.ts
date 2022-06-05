export class Converters {
	static camelCaseKeysToUnderscore(object: any): any {
		if (typeof object != 'object') return object;
		let newName;
		for (const oldName in object) {
			newName = oldName.replace(/([A-Z])/g, function ($1) {
				return '_' + $1.toLowerCase();
			});

			if (newName != oldName) {
				if (object.hasOwnProperty(oldName)) {
					object[newName] = object[oldName];
					delete object[oldName];
				}
			}

			if (typeof object[newName] == 'object') {
				object[newName] = this.camelCaseKeysToUnderscore(object[newName]);
			}
		}
		return object;
	}

	static parseString(value: string) {
		const number = Number(value);

		if (isNaN(number)) return undefined;
		return number;
	}

	static stringTemplateParser(expression: string, valueObj: { [key: string]: string }) {
		const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
		let text = expression.replace(templateMatcher, (_, value, __) => {
			value = valueObj[value];
			return value;
		});
		return text;
	}

	static splitPascalCase(word: string) {
		var wordRe = /($[a-z])|[A-Z][^A-Z]+/g;
		return word.match(wordRe)?.join(' ');
	}
}
