import { loadMariaDbConfig } from '../../config.ts';
import { MariaDbClient } from './client.ts';

const db = new MariaDbClient(loadMariaDbConfig());

console.log('Showing tables...\n');
const tables = await db.query('SHOW TABLES') as Record<string, string>[];
console.log(`Found ${tables.length} tables:\n`);
for (const row of tables) {
    console.log(`  ${Object.values(row)[0]}`);
}

console.log('\nCounting pending/processing actions...\n');
const stats = await db.query('SELECT status, COUNT(*) as cnt FROM actions GROUP BY status') as { status: string; cnt: number }[];
for (const row of stats) {
    console.log(`  ${row.status}: ${row.cnt}`);
}

await db.end();
