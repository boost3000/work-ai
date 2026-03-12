import { loadElasticsearchConfig } from '../../config.ts';
import { ElasticsearchClient } from './client.ts';

const es = new ElasticsearchClient(loadElasticsearchConfig());

console.log('Searching general logs for "error" (last 24h, limit 5)...\n');
const logs = await es.searchLogs({ search: 'error', size: 5 });
console.log(`Got ${logs.length} hits:\n`);
for (const log of logs) {
    const gidStr = log.gid ? ` [GID ${log.gid}]` : '';
    console.log(`  [${log.timestamp}]${gidStr} ${log.message.slice(0, 100)}`);
}

console.log('\nSearching gameserver logs for GID 1488318 (last 24h, limit 5)...\n');
const gsLogs = await es.searchGameserverLogs(1488318, { size: 5 });
console.log(`Got ${gsLogs.length} hits:\n`);
for (const log of gsLogs) {
    console.log(`  [${log.timestamp}] ${log.message.slice(0, 100)}`);
}
