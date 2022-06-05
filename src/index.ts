import { ConcordClient } from "./classes/ConcordClient";
import dotenv from "dotenv";
dotenv.config();

const client = new ConcordClient();

client.login(process.env.TOKEN);