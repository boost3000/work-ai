import { loadJiraConfig } from '../../config.ts';
import { ConfluenceClient } from './client.ts';

const config = loadJiraConfig();
const confluence = new ConfluenceClient(config);

console.log('Fetching spaces...\n');
const spaces = await confluence.getSpaces();
for (const space of spaces) {
    console.log(`  [${space.key}] ${space.name}`);
}
console.log(`  ... ${spaces.length} spaces total\n`);

if (spaces.length > 0) {
    const first = spaces[0];
    console.log(`Pages in "${first.name}":\n`);
    const pages = await confluence.getPages(first.id, 5);
    for (const page of pages) {
        console.log(`  ${page.id}: ${page.title}`);
    }
}

console.log('\nSearching for recent content...\n');
const results = await confluence.search('type=page ORDER BY lastmodified DESC', 5);
for (const r of results) {
    console.log(`  ${r.content?.title} — ${r.excerpt.slice(0, 80)}`);
}
