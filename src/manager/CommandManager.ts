import type { CommandAndEventLoadOptions, CommandLoadOptions } from '../typings';

import { REST } from '@discordjs/rest';
import { ApplicationCommandData, BaseManager, Client, LimitedCollection } from 'discord.js';
import { Enumerable } from '../utils/decorators';
import glob from 'glob';
import { promisify } from 'node:util';
import { join, basename, normalize } from 'node:path';
import { Util } from '../utils/';
import { Routes } from 'discord-api-types/v10';
import { Constants } from '../typings/constants';
import { Error, Listener, Command } from '../structures/';

const globPromise = promisify(glob);
let firstRun = true;
export class CommandManager extends BaseManager {
	@Enumerable(false)
	public readonly cache = new LimitedCollection<string, Command>({
		maxSize: 100,
		keepOverLimit: () => {
			throw new Error('APPLICATION_COMMAND_LIMIT');
		}
	});

	constructor(client: Client) {
		super(client);
	}

	private handlePathOption(path: string, option?: CommandLoadOptions['options']) {
		const { extensions = ['ts'], subfolderDepth } = option ?? {};

		if (subfolderDepth) {
			const array = new Array(subfolderDepth).fill('**');
			path = join(path, ...array);
		}

		path = extensions ? (extensions.length > 1 ? `${path}/*.{${extensions.join(',')}}` : `${path}/*.${extensions[0]}`) : join(path, '*');
		return normalize(path);
	}
	/**
	 * Load commands into the cache and create events listener.
	 * @param option {CommandLoadOptions}
	 */
	public async load(option: CommandLoadOptions) {
		const { path, options = {} } = option;
		const { deploy, errorOnEmptyFile, errorOnNoMatches } = options;
		let { events, commands } = path;

		if (commands) {
			commands = this.handlePathOption(commands, option.options);

			await this.loadCommands(commands, {
				errorOnNoMatches: errorOnNoMatches,
				errorOnEmptyFile: errorOnEmptyFile
			});
			if (deploy) this.deploy();
		}

		if (events) {
			events = this.handlePathOption(events, option.options);

			await this.loadEvents(events, {
				errorOnNoMatches: errorOnNoMatches,
				errorOnEmptyFile: errorOnEmptyFile
			});
		}
	}

	public deploy() {
		if (!this.cache.size) throw new Error(`EMPTY_RESOURCE`, 'Cache of', this.constructor.name);

		const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);
		const clientId = Constants.ClientId;
		const targetGuildId = Constants.DevelopmentGuildId;

		//TODO
		const data = {
			global: [] as ApplicationCommandData[][],
			local: [] as ApplicationCommandData[][]
		};

		this.cache.map((command) => {
			const apiCommand = command.toJSON();
			if (!apiCommand.length)
				return this.client.logger.debug(this.constructor.name, `Ignored command '${command.data.name}' for lacking run function(s).`);
			data[command.isGlobal() ? 'global' : 'local'].push(apiCommand);
		});

		if (data.local.length) {
			const commandData = data.local.flat();

			targetGuildId.map((id) =>
				rest
					.put(Routes.applicationGuildCommands(clientId, id), { body: commandData })
					.then(() => {
						this.client.logger.info(
							this.constructor.name,
							`Successfully deployed ${commandData.length} local command(s) on guild ${id}.`
						);
					})

					.catch((err) => {
						this.client.logger.error(this.constructor.name, err);
						process.exit(0);
					})
			);
		}
		if (data.global.length) {
			const commandData = data.global.flat();

			rest.put(Routes.applicationCommands(clientId), { body: commandData })
				.then(() => {
					this.client.logger.info(this.constructor.name, `Successfully deployed ${commandData.length} global command(s).`);
				})
				.catch((err) => {
					this.client.logger.error(this.constructor.name, err);
					process.exit(0);
				});
		}
	}

	public refreshCache(path: string) {
		delete require.cache[require.resolve(path)];

		const file = import(path);

		return file;
	}

	protected async loadCommands(globPattern: string, options?: CommandAndEventLoadOptions) {
		const files = await globPromise(globPattern);

		if (!files.length && options?.errorOnNoMatches) {
			throw new Error('NO_MATCHES', globPattern);
		}

		for (const file of files) {
			const commandFile = await this.refreshCache(file);
			const command = Object.values({ ...commandFile })[0] as any;

			if (typeof command === 'undefined') {
				if (options?.errorOnEmptyFile) new Error('EMPTY_RESOURCE', Command.name, basename(file));
			}

			const constructedCommand = Reflect.construct(command, []) as Command;

			constructedCommand.path = file;

			this.loadToCache(constructedCommand);
		}

		firstRun = false;
	}

	public async loadEvents(globPattern: string, options?: CommandAndEventLoadOptions) {
		const files = await globPromise(globPattern);

		if (!files.length && options?.errorOnNoMatches) {
			throw new Error('NO_MATCHES', globPattern);
		}

		for (const file of files) {
			const listenerFile = await this.refreshCache(file);

			const listener = Object.values({ ...listenerFile })[0] as any;

			if (typeof listener === 'undefined') {
				if (options?.errorOnEmptyFile) new Error('EMPTY_RESOURCE', Listener.name, basename(file));
			}

			const constructedEvent = Reflect.construct(listener, [this.client]) as Listener<any>;

			constructedEvent.path = file;

			constructedEvent.load();
		}
	}

	private loadToCache(data: Command) {
		if (this.cache.has(data.data.name) && firstRun) throw new Error('DUPLICATED_RESOURCE', Command.name, data.data.name, this.cache.constructor.name);
		this.cache.set(data.data.name, data);
	}

	//@ts-expect-error
	private unloadFromCache(data: Command | string) {
		this.cache.delete(Util.isString(data) ? data : data.data.name);
	}
}
