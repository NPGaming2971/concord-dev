import { ConcordClient } from './classes/ConcordClient';
import dotenv from 'dotenv';
dotenv.config();

const startTime = Date.now();
const client = new ConcordClient();

client.logger.info(`Client`, `Application took ${Date.now() - startTime}ms to start up.`);
client.login(process.env.TOKEN);
