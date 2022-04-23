export class Converters {
	static camelCaseKeysToUnderscore(obj: any): any {
		if (typeof obj != "object") return obj;
		let newName;
		for (var oldName in obj) {
			newName = oldName.replace(/([A-Z])/g, function ($1) {
				return "_" + $1.toLowerCase();
			});

			if (newName != oldName) {
				if (obj.hasOwnProperty(oldName)) {
					obj[newName] = obj[oldName];
					delete obj[oldName];
				}
			}

			if (typeof obj[newName] == "object") {
				obj[newName] = this.camelCaseKeysToUnderscore(obj[newName]);
			}
		}
		return obj;
	}

	static stringTemplateParser(
		expression: string,
		valueObj: { [key: string]: string }
	) {
		const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
		let text = expression.replace(templateMatcher, (_, value, __) => {
			value = valueObj[value];
			return value;
		});
		return text;
	}
}
