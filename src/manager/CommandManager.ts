import { Client, LimitedCollection } from "discord.js";
import type { Command } from "../structures/Command";
import type {
	CommandAndEventLoadOptions,
	CommandLoadOptions,
} from "../typings";
import { REST } from "@discordjs/rest";
import { Enumerable } from "../utils/decorators";
import glob from "glob";
import { promisify } from "util";
const globPromise = promisify(glob);
import { join } from "path";
import type { Listener } from "../structures/Listener";
import { Util } from "../utils/utils";
import { Routes } from "discord.js/node_modules/discord-api-types/v10";
import { Constants } from "../typings/constants";

export class CommandManager {
	
	@Enumerable(false)
	public readonly cache = new LimitedCollection<string, Command>({
		maxSize: 100,
		keepOverLimit: () => {
			throw new Error("Maximum number of slash commands reached (100).");
		},
	});

	public client: Client;

	constructor(client: Client) {
		this.client = client;
	}

	private handlePathOption(
		path: string,
		option?: CommandLoadOptions["options"]
	) {
		if (option?.subfolderDepth) {
			const array = new Array(option.subfolderDepth).fill("**");
			path = join(path, ...array);
		}

		path = option?.extensions
			? option.extensions.length > 1
				? `${path}\\*.{${option.extensions.join(",")}}`
				: `${path}\\*.${option.extensions[0]}`
			: join(path, "*");
		return path;
	}

	public async load(option: CommandLoadOptions) {
		const { path } = option;
		if (option.options) {
			if (option.options) {
			}
		}

		if (path.commands) {
			path.commands = this.handlePathOption(path.commands, option.options);

			await this.loadCommands(path.commands, {
				errorOnNoMatches: option.options?.errorOnNoMatches,
			});
			if (option.options?.deploy) this.deploy();
		}

		if (path.events) {
			path.events = this.handlePathOption(path.events, option.options);

			await this.loadEvents(path.events, {
				errorOnNoMatches: option.options?.errorOnNoMatches,
			});
		}
	}

	public deploy() {
		//Preconditions: CommandManager.cache is populated

		if (this.cache.size === 0)
			throw new Error("CommandManager.cache is empty.");

		const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);
		const clientId = Constants.CLIENT_ID;
		const targetGuildId: string[] = ["755892553827483799"];
		//TODO
		const data = {
			global: [] as any[],
			local: [] as any[],
		};

		this.cache.map((command) => {
			data[command.isGlobal() ? "global" : "local"].push(command.toJSON());
		});

		if (data.local.length)
			targetGuildId.map((id) =>
				rest
					.put(Routes.applicationGuildCommands(clientId, id), { body: data.local })
					.then(() =>
						this.client.logger.info( this.constructor.name, `Successfully deployed ${data.local.length} local command(s) on guild <${id}>.`)
					)
					.catch((err) => this.client.logger.error(this.constructor.name, err))
			);
		if (data.global.length)
			rest
				.put(Routes.applicationCommands(clientId), { body: data.global })
				.then(() => this.client.logger.info(this.constructor.name, `Successfully deployed ${data.global.length} global command(s).`))
				.catch((err) => this.client.logger.error(this.constructor.name, err))
	}

	public async loadCommands(
		globPattern: string,
		options?: CommandAndEventLoadOptions
	) {
		const files = await globPromise(globPattern);
		if (!files.length && options?.errorOnNoMatches) {
			throw new Error("Specified pattern has no matches.");
		}

		for (const file of files) {
			delete require.cache[require.resolve(file)];

			const command = require(file).default;
			const constructedCommand = Reflect.construct(command, []) as Command;

			constructedCommand.path = file;

			this.loadToCache(constructedCommand);
		}
	}
	
	private async loadEvents(
		globPattern: string,
		options?: CommandAndEventLoadOptions
	) {
		const files = await globPromise(globPattern);
		if (!files.length && options?.errorOnNoMatches) {
			throw new Error("Specified pattern has no matches.");
		}

		for (const file of files) {
			delete require.cache[require.resolve(file)];
			const event = require(file).default;

			const constructedEvent = Reflect.construct(event, [
				this.client,
			]) as Listener<any>;

			constructedEvent.path = file;

			constructedEvent.load();
		}
	}

	private loadToCache(data: Command) {
		this.cache.set(data.data.name, data);
	}

	//@ts-expect-error
	private unloadFromCache(data: Command | string) {
		this.cache.delete(Util.isString(data) ? data : data.data.name);
	}
}
