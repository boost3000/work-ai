import { loadGitLabConfig } from '../../config.ts';
import { GitLabClient } from './client.ts';

const gitlab = new GitLabClient(loadGitLabConfig());

console.log('Listing your GitLab projects...\n');
const projects = await gitlab.listProjects(undefined, 10);
console.log(`Found ${projects.length} projects:\n`);

for (const p of projects) {
    console.log(`  [${p.id}] ${p.path_with_namespace} — ${p.description ?? '(no description)'}`);
}

if (projects.length > 0) {
    const first = projects[0];
    console.log(`\nBrowsing root of ${first.path_with_namespace} (${first.default_branch}):`);
    const tree = await gitlab.getTree(first.id);
    for (const item of tree) {
        console.log(`  ${item.type === 'tree' ? '📁' : '📄'} ${item.path}`);
    }
}
