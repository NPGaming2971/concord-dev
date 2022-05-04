import type { NonNullObject } from "../typings";

export function Enumerable(value: boolean) {
	return (target: unknown, key: string) => {
		Reflect.defineProperty(target as NonNullObject, key, {
			enumerable: value,
			set(this: unknown, val: unknown) {
				Reflect.defineProperty(this as NonNullObject, key, {
					configurable: true,
					enumerable: value,
					value: val,
					writable: true
				});
			}
		});
	};
}

export function ApplyToClass(targetClass: any): MethodDecorator {
	return (target, key, _descriptor) => {
		const functionToApply = Reflect.get(target, key)
		Object.defineProperty(targetClass.prototype, key, {
			value: functionToApply.bind(targetClass.prototype),
			writable: true,
			enumerable: false
		})
	}
}

export function createProxy<T extends object>(target: T, handler: Omit<ProxyHandler<T>, 'get'>): T {
	return new Proxy(target, {
		...handler,
		get: (target, property) => {
			const value = Reflect.get(target, property);
			return typeof value === 'function' ? (...args: readonly unknown[]) => value.apply(target, args) : value;
		}
	});
}