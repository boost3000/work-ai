import { loadSlackConfig } from '../../config.ts';
import { SlackClient } from './client.ts';

const config = loadSlackConfig();
const slack = new SlackClient(config);

console.log('Fetching channels...\n');
const channels = await slack.getChannels();
for (const ch of channels.slice(0, 10)) {
    console.log(`  #${ch.name}  (${ch.num_members ?? '?'} members)`);
}
console.log(`  ... ${channels.length} channels total\n`);

console.log('Fetching users...\n');
const users = await slack.getUsers();
for (const u of users.slice(0, 10)) {
    console.log(`  @${u.name}  ${u.real_name}`);
}
console.log(`  ... ${users.length} users total\n`);

if (channels.length > 0) {
    const first = channels[0];
    console.log(`Recent messages in #${first.name}:\n`);
    const messages = await slack.getMessages(first.id, 5);
    for (const msg of messages.reverse()) {
        console.log(`  [${msg.ts}] ${msg.user ?? 'system'}: ${msg.text.slice(0, 100)}`);
    }
}
