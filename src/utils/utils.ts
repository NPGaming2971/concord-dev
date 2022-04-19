import type { Awaitable } from "discord.js";
import { Logger } from "../classes/Logger";

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
}