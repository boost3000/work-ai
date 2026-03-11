import { loadJiraConfig } from '../../config.ts';
import { JiraClient } from './client.ts';

const config = loadJiraConfig();
const jira = new JiraClient(config);

console.log('Fetching your issues...\n');
const result = await jira.getMyIssues();
console.log(`Found ${result.issues.length} issues:\n`);

for (const issue of result.issues) {
    console.log(`  ${issue.key}  [${issue.fields.status.name}]  ${issue.fields.summary}`);
}

if (result.issues.length > 0) {
    const first = result.issues[0];
    console.log(`\nTransitions available for ${first.key}:`);
    const transitions = await jira.getTransitions(first.key);
    for (const t of transitions) {
        console.log(`  ${t.id}: ${t.name} → ${t.to.name}`);
    }
}
