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
		extensions: ["ts"],
		subfolderDepth: 1,
		deploy: true,
	},
});
client.login(process.env.TOKEN);