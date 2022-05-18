'use strict';

import { Formatters } from "discord.js";

// Heavily inspired by node's `internal/errors` module

const kCode = Symbol('code');
const messages = new Map();

export class ConcordError extends Error {
	constructor(key: string, ...args: any[]) {
		super(message(key, args));
		//@ts-expect-error
		this[kCode] = key;
		if (Error.captureStackTrace) Error.captureStackTrace(this, ConcordError);
	}

	override get name() {
		//@ts-expect-error
		return `${super.name} [${this[kCode]}]`;
	}

	get code() {
		//@ts-expect-error
		return this[kCode];
	}

	override toString() {
		`\`⚠\` ${Formatters.bold(this.name)}\n${this.message}`;
	}
}

function message(key: string, args: unknown[]) {
	if (typeof key !== 'string') throw new Error('Error message key must be a string');
	const msg = messages.get(key);
	if (!msg) throw new Error(`An invalid error message key was used: ${key}.`);
	if (typeof msg === 'function') return msg(...args);
	if (!args?.length) return msg;
	args.unshift(msg);
	return String(...args);
}

export function register(sym: string, val: any) {
	messages.set(sym, typeof val === 'function' ? val : String(val));
}
