import type { Constructable } from 'discord.js';
import type { NonNullObject } from '../typings';

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

type ApplyToClassOptions = {
	makeStatic?: boolean;
	isGetter?: boolean;
};

export function ApplyToClass<T>(targetClass: Constructable<T>, options: ApplyToClassOptions = {}): MethodDecorator {
	const { makeStatic = false, isGetter = false } = options;

	return (target: object, key: string | symbol) => {
		const functionToApply = Reflect.get(target, key);

		const defineTarget = makeStatic ? targetClass : targetClass.prototype;

		Object.defineProperty(defineTarget, key, {
			get() {
				return isGetter ? functionToApply.call(target, this) : functionToApply.bind(target, this);
			},
			enumerable: false
		});
	};
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
