import { ConcordClient } from './classes/ConcordClient';
import dotenv from 'dotenv';
import { GatewayIntentBits, Options, Partials } from 'discord.js';
dotenv.config();

const start = performance.now();
const client = new ConcordClient({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [Partials.User, Partials.Reaction, Partials.Message],
	makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
		PresenceManager: 0,
		ThreadManager: 0,
		ThreadMemberManager: 0,
		GuildEmojiManager: 0,
		GuildScheduledEventManager: 0,
		GroupMessageManager: 250,
		VoiceStateManager: 0
	}),
	commands: {
		path: {
			commands: './src/commands',
			events: './src/listener'
		},
		subfolderDepth: 1,
		deploy: true,
		errors: ['EmptyFile', 'NoMatches']
	}
});
const end = performance.now();

client.logger.debug('Client', `Client took ${(end - start).toFixed(2)}ms to initialize.`);

client.login(process.env.TOKEN);

process.on('SIGINT', () => {
	console.log('Hello')
})
