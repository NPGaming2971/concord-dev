export class Converters {
	static camelCaseKeysToUnderscore(obj: { [key: string]: any }) {
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
}
