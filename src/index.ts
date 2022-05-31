import { ConcordClient } from "./classes/ConcordClient";
import dotenv from "dotenv";
dotenv.config();

const client = new ConcordClient();
client.commands.load({
	path: {
		commands: `${process.cwd()}/src/commands/`,
		events: `${process.cwd()}/src/listener/`,
	},
	options: {
		errorOnNoMatches: true,
		subfolderDepth: 1,
		deploy: true,
		extensions: ["ts"],
	},
});

process.on('unhandledRejection', (err) => {
	console.log(err)
})

client.login(process.env.TOKEN);