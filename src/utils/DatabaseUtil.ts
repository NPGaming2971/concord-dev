export class DatabaseUtil {
	static parseRawData(rawData: any): any {
		if (typeof rawData !== "object") throw new Error("Invalid parameter type.");
		const objIterable = Object.entries(rawData);
		//Check if given parameter is iterable.
		if (typeof objIterable[Symbol.iterator] !== "function")
			throw new Error("Parameter is uniterable.");
		const resolved: any = {};
		for (const [key, val] of objIterable) {
			Object.assign(resolved, {
				[`${key}`]:
					typeof val === "string" && val.startsWith("[") && val.endsWith("]")
						? JSON.parse(val)
						: typeof val == "string" && val.startsWith("{") && val.endsWith("}")
						? JSON.parse(val)
						: val,
			});
		}
		return resolved;
	}
	static makeDatabaseCompatible(data: object) {
		const objIterable = Object.entries(data);

		const resolved: any = {};
		for (const [key, val] of objIterable) {
			Object.assign(resolved, {
				[`${key}`]: typeof val !== "string" ? JSON.stringify(val) : val,
			});
		}
		return resolved;
	}
}
