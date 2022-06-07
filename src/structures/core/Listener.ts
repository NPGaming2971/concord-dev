import type { Client, ClientEvents } from "discord.js";
import type { EventEmitter } from "node:events";
import { fromAsync } from "@sapphire/result";

export abstract class Listener<E extends keyof ClientEvents> {

	public emitter: EventEmitter;
	public once: boolean;
	public name: E;
	private _listener: ((...args: any[]) => void) | null;
    public path?: string

	constructor(client: Client, data: ListenerConstructor<E>) {
		this.emitter =
			typeof data.emitter === "undefined"
				? client
				: (typeof data.emitter === "string"
						? (Reflect.get(client, data.emitter) as EventEmitter)
						: data.emitter) ?? null;
		this.once = data.once || false;
		this.name = data.name as E;
		this._listener = this.emitter && this.name ? this._run.bind(this) : null;	
    }


	public abstract run(...args: ClientEvents[E]): unknown;
	
	private async _run(...args: unknown[]) {
		//@ts-expect-error
		return await fromAsync(() => this.run(...args));
	}

	/**
	 * Unload this event from the emitter.
	 * @returns {void}
	 */
	public unload() {
		if (this._listener) {
			const emitter = this.emitter!;

			// Increment the maximum amount of listeners by one:
			const maxListeners = emitter.getMaxListeners();
			if (maxListeners !== 0) emitter.setMaxListeners(maxListeners - 1);

			emitter.off(this.name, this._listener);
			this._listener = null;
		}
	}

	/**
	 * Listen to this event from the emitter.
	 * @returns {void}
	 */
	public load() {
		if (this._listener) {
			const emitter = this.emitter!;

			const maxListeners = emitter.getMaxListeners();
			if (maxListeners !== 0) emitter.setMaxListeners(maxListeners + 1);

			emitter[this.once ? "once" : "on"](this.name, this._listener);
		}
	}
}

interface ListenerConstructor<E> {
	once?: boolean;
	name: E;
	emitter?: keyof Client | EventEmitter;
}
