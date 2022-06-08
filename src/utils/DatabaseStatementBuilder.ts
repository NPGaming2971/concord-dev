import { isBuffer, isNull, isNumber, isString } from 'lodash';

export enum Separators {
	Equal = ' = ',
	Comma = ', ',
	Empty = '',
	Space = ' ',
	And = ' AND ',
	Or = ' OR ',
	Colon = `: `
}

enum OrderType {
	Ascending = 'ASC',
	Descending = 'DESC'
}
type OrderByParameter = {
	[key: string]: OrderType;
};


export class DatabaseStatementBuilder {
	public static transformObject(object: object, inBetween: Separators = Separators.Empty, splitBy: Separators = Separators.Space) {
		this.validateObject(object);

		const iterable = Object.entries(object);
		const expressions = [];

		for (const [key, value] of iterable) {
			const stringValue = this.handleType(value)!;
			expressions.push(`${key}${inBetween}${stringValue.length ? stringValue : "''"}`);
		}
		return expressions.join(splitBy);
	}

	private static handleType(value: any) {

        if (isBuffer(value)) throw new TypeError('Can not handle buffer.')

		if (isNull(value) || isNumber(value) || typeof value === 'bigint') {
			return String(value);
		} else if (isString(value)) {
			const surround = (value: string, seperator: string) => `${seperator}${value}${seperator}`;
			return surround(value, "'");
		}

		return;
	}

	private static validateObject(object: object) {
		const values = Object.values(object);

		if (values.some((i) => Reflect.apply(Object.prototype.toString, i, []) === '[object Object]')) {
			throw new TypeError('Invalid object parameter: object values must be all primitive value.');
		}

		return;
	}

	static update(tableName: string, data: object, location?: object, order?: OrderByParameter) {
		return `UPDATE ${tableName} SET ${this.transformObject(data, Separators.Equal, Separators.Comma)} ${
			location ? `WHERE ${this.transformObject(location, Separators.Equal, Separators.And)}` : Separators.Empty
		} ${order ? `ORDER BY ${this.transformObject(order, Separators.Space, Separators.Colon)}` : Separators.Empty}`;
	}
}