import { loadLokiConfig } from '../../config.ts';
import { LokiClient } from './client.ts';

const loki = new LokiClient(loadLokiConfig());

console.log('Fetching Loki labels...\n');
const labels = await loki.getLabels();
console.log(`Found ${labels.length} labels:\n`);
for (const label of labels) {
    console.log(`  ${label}`);
}

if (labels.length > 0) {
    const first = labels[0];
    console.log(`\nValues for label "${first}":`);
    const values = await loki.getLabelValues(first);
    for (const v of values.slice(0, 10)) {
        console.log(`  ${v}`);
    }
    if (values.length > 10) console.log(`  ... and ${values.length - 10} more`);
}

console.log('\nQuerying recent logs (last 1h, limit 5)...\n');
const entries = await loki.queryRange({ query: '{job!=""}', limit: 5 });
console.log(`Got ${entries.length} entries:\n`);
for (const entry of entries) {
    const labelStr = Object.entries(entry.labels).map(([k, v]) => `${k}=${v}`).join(', ');
    console.log(`  [${entry.timestamp}] (${labelStr}) ${entry.line.slice(0, 100)}`);
}
