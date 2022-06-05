import { Channel, Constructable, Formatters } from 'discord.js';
import { upperFirst } from 'lodash';
// Heavily inspired by node's `internal/errors` module

const kCode = Symbol('code');
const messages = new Map<string, MessageKey>();

const Messages = {
	NO_TYPE_SPECIFIED: 'You did not specify application command type.',

	// Preconditions
	ELEVATED_PERMISSION_REQUIRED: 'You do not possess sufficient to execute this action.',
	MISSING_USER_PERMISSIONS: (permissions: string) =>
		`You do not have the required permissions to execute this command. Expected permissions: ${permissions}`,
	MISSING_CLIENT_PERMISSIONS: (permissions: string) =>
		`I do not have the required permissions to execute this command. Expected permissions: ${permissions}`,
	CHANNEL_TYPE_PRECONDITIONS_FAILED: (channelTypes: string) =>
		`You can not use this command in this channel. Expected channel types: ${channelTypes}`,
	DISALLOWED_LOCATION: (type: 'channel' | 'guild') => `You can not use this command in this ${type}.`,

	EMPTY_COMMAND_FILE: (name: string) => `The file ${name} has no exported structure.`,
	EMPTY_RESOURCE: (name: string) => `${name} exists but is empty.`,
	NON_EXISTENT_RESOURCE: (type: string, name: string, location?: string) => `${upperFirst(type)} '${name}' does not exist in ${location ? ` in ${location}` : ''}.`,
	DUPLICATED_RESOURCE: (type: string, name: string,  location?: string) => `${upperFirst(type)} '${name}' already existed${location ? ` in ${location}` : ''}.`,
	
	GROUP_CHANNEL_LIMIT: (groupName: string, limit: string | number) => `Maximum number of channels of group '${groupName}' reached (${limit}).`,
 
	CHANNEL_UNREGISTERED: (channel: Channel) => `Channel '${channel.id}' is not registered.`,
	THIS_MESSAGE_IS_ORPHANED: "This message doesn't have a parent id.",
	NO_MATCHES: (pattern: string) => `Pattern '${pattern}' has no matches.'`,
	APPLICATION_COMMAND_LIMIT: `Maximum number of application commands reached (100).`
};

type MessageKey = string | ((...args: any[]) => string);
type ErrorKey = keyof typeof Messages;

export function makeError(Base: Constructable<Error>) {
	return class ConcordError<K extends ErrorKey> extends Base {
		
		public [kCode]: K;

		constructor(key: K, ...args: typeof Messages[K] extends string ? never : Parameters<Exclude<typeof Messages[K], string>>) {
			super(message(key, args));
			this[kCode] = key;
			if (Error.captureStackTrace) Error.captureStackTrace(this, ConcordError);
		}

		override get name() {
			return `${super.name} [${this[kCode]}]`;
		}

		override set name(value) {
			this.name = value;
		}

		get code() {
			return this[kCode];
		}

		override toString() {
			`\`⚠\` ${Formatters.bold(this.name)}\n${this.message}`;
		}
	};
}

function message(key: ErrorKey, args: unknown[]) {
	if (typeof key !== 'string') throw new Error('Error message key must be a string');

	const msg = messages.get(key);
	if (!msg) throw new Error(`An invalid error message key was used: ${key}.`);
	if (typeof msg === 'function') return msg(...args);
	if (!args?.length) return msg;
	args.unshift(msg);
	return String(...args);
}

function register(sym: string, val: any) {
	messages.set(sym, typeof val === 'function' ? val : String(val));
}

for (const [name, message] of Object.entries(Messages)) {
	register(name, message);
}

const err = makeError(Error);
export { err as Error };

const typeErr = makeError(TypeError);
export { typeErr as TypeError };

const rangeErr = makeError(RangeError);
export { rangeErr as RangeError };
