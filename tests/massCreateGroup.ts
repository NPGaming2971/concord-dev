import { ConcordClient } from '../src/classes/ConcordClient';
import { randomBytes } from 'node:crypto';
import { SnowflakeUtil } from 'discord.js';
const client = new ConcordClient();

function massCreateGroup(n: number) {
	for (let i = 0; i++, i < n;) {
		const groupTag = randomBytes(20).toString('hex');

		client.groups.create(groupTag, { owner: String(SnowflakeUtil.generate()) });
	}
}

massCreateGroup(0)
