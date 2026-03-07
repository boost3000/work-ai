import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { loadGitLabConfig, loadJiraConfig, loadMariaDbConfig, loadSlackConfig } from '../config.ts';
import { GitLabClient } from '../gitlab/client.ts';
import { JiraClient } from '../jira/client.ts';
import { MariaDbClient } from '../mariadb/client.ts';
import { SlackClient } from '../slack/client.ts';
import { ConfluenceClient } from '../confluence/client.ts';

const jiraConfig = loadJiraConfig();
const jira = new JiraClient(jiraConfig);
const slack = new SlackClient(loadSlackConfig());
const confluence = new ConfluenceClient(jiraConfig);
const gitlab = new GitLabClient(loadGitLabConfig());
const mariadb = new MariaDbClient(loadMariaDbConfig());

const server = new McpServer({ name: 'work-ai', version: '1.0.0' });

// Jira
server.registerTool(
    'jira_list_issues',
    {
        description: 'List my open Jira issues. Returns key, summary, status for each issue.',
        inputSchema: {
            jql: z.string().optional().describe('Optional JQL query. Defaults to open issues assigned to me, ordered by last update.'),
            maxResults: z.number().optional().describe('Max results to return (default 50)'),
        },
    },
    async ({ jql, maxResults }) => {
        const result = await jira.getMyIssues(jql, maxResults);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    result.issues.map((i) => ({
                        key: i.key,
                        summary: i.fields.summary,
                        status: i.fields.status.name,
                        assignee: i.fields.assignee?.displayName ?? null,
                        priority: i.fields.priority?.name,
                        updated: i.fields.updated,
                    })),
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'jira_get_issue',
    {
        description: 'Get details of a single Jira issue by key (e.g. NET-1234).',
        inputSchema: {
            issueKey: z.string().describe('The issue key, e.g. NET-1234'),
        },
    },
    async ({ issueKey }) => {
        const issue = await jira.getIssue(issueKey);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    {
                        key: issue.key,
                        summary: issue.fields.summary,
                        status: issue.fields.status.name,
                        assignee: issue.fields.assignee?.displayName ?? null,
                        reporter: issue.fields.reporter?.displayName ?? null,
                        priority: issue.fields.priority?.name,
                        project: issue.fields.project?.name,
                        type: issue.fields.issuetype?.name,
                        labels: issue.fields.labels,
                        created: issue.fields.created,
                        updated: issue.fields.updated,
                        description: issue.fields.description,
                    },
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'jira_get_transitions',
    {
        description: 'List available status transitions for a Jira issue.',
        inputSchema: {
            issueKey: z.string().describe('The issue key, e.g. NET-1234'),
        },
    },
    async ({ issueKey }) => {
        const transitions = await jira.getTransitions(issueKey);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(transitions.map((t) => ({ id: t.id, name: t.name, to: t.to.name })), null, 2),
            }],
        };
    },
);

server.registerTool(
    'jira_transition_issue',
    {
        description: 'Move a Jira issue to a different status. Use jira_get_transitions first to find the transition ID.',
        inputSchema: {
            issueKey: z.string().describe('The issue key, e.g. NET-1234'),
            transitionId: z.string().describe('The transition ID to apply'),
        },
    },
    async ({ issueKey, transitionId }) => {
        await jira.transitionIssue(issueKey, transitionId);
        return { content: [{ type: 'text', text: `Transitioned ${issueKey} successfully.` }] };
    },
);

server.registerTool(
    'jira_add_comment',
    {
        description: 'Add a comment to a Jira issue.',
        inputSchema: {
            issueKey: z.string().describe('The issue key, e.g. NET-1234'),
            text: z.string().describe('The comment text'),
        },
    },
    async ({ issueKey, text }) => {
        const comment = await jira.addComment(issueKey, text);
        return { content: [{ type: 'text', text: `Comment added (id: ${comment.id}) to ${issueKey}.` }] };
    },
);

server.registerTool(
    'jira_create_issue',
    {
        description: 'Create a new Jira issue.',
        inputSchema: {
            projectKey: z.string().describe('Project key, e.g. NET'),
            issueType: z.string().describe('Issue type, e.g. Task, Bug, Story'),
            summary: z.string().describe('Issue summary/title'),
            description: z.string().optional().describe('Optional description text'),
            assigneeId: z.string().optional().describe('Optional assignee account ID'),
        },
    },
    async ({ projectKey, issueType, summary, description, assigneeId }) => {
        const created = await jira.createIssue(projectKey, issueType, summary, description, assigneeId);
        return { content: [{ type: 'text', text: JSON.stringify(created, null, 2) }] };
    },
);

server.registerTool(
    'jira_update_issue',
    {
        description: 'Update fields of an existing Jira issue (summary, priority name, assignee id, etc.).',
        inputSchema: {
            issueKey: z.string().describe('The issue key, e.g. NET-1234'),
            fields: z.record(z.unknown()).describe('Fields to update, e.g. {"summary": "New title", "priority": {"name": "High"}}'),
        },
    },
    async ({ issueKey, fields }) => {
        await jira.updateIssue(issueKey, fields);
        return { content: [{ type: 'text', text: `Updated ${issueKey} successfully.` }] };
    },
);

server.registerTool(
    'jira_get_boards',
    {
        description: 'List Jira boards, optionally filtered by project key.',
        inputSchema: {
            projectKey: z.string().optional().describe('Optional project key to filter boards, e.g. NET'),
        },
    },
    async ({ projectKey }) => {
        const boards = await jira.getBoards(projectKey);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(boards.map((b) => ({ id: b.id, name: b.name, type: b.type })), null, 2),
            }],
        };
    },
);

server.registerTool(
    'jira_get_sprints',
    {
        description: 'List sprints for a Jira board.',
        inputSchema: {
            boardId: z.number().describe('The board ID'),
            state: z.enum(['active', 'closed', 'future']).optional().describe('Filter by sprint state (default: all)'),
        },
    },
    async ({ boardId, state }) => {
        const sprints = await jira.getSprints(boardId, state);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    sprints.map((s) => ({
                        id: s.id,
                        name: s.name,
                        state: s.state,
                        startDate: s.startDate,
                        endDate: s.endDate,
                        goal: s.goal,
                    })),
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'jira_add_issues_to_sprint',
    {
        description: 'Add one or more Jira issues to a sprint.',
        inputSchema: {
            sprintId: z.number().describe('The sprint ID'),
            issueKeys: z.array(z.string()).describe('List of issue keys to add, e.g. ["NET-1234", "NET-1235"]'),
        },
    },
    async ({ sprintId, issueKeys }) => {
        await jira.addIssueToSprint(sprintId, issueKeys);
        return { content: [{ type: 'text', text: `Added ${issueKeys.join(', ')} to sprint ${sprintId}.` }] };
    },
);

server.registerTool(
    'jira_search_users',
    {
        description: 'Search Jira users by name or email. Returns accountId, displayName, emailAddress.',
        inputSchema: {
            query: z.string().describe('Name or email to search for'),
            maxResults: z.number().optional().describe('Max results (default 10)'),
        },
    },
    async ({ query, maxResults }) => {
        const users = await jira.searchUsers(query, maxResults);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    users.map((u) => ({ accountId: u.accountId, displayName: u.displayName, email: u.emailAddress })),
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'jira_get_attachments',
    {
        description: 'List file attachments on a Jira issue.',
        inputSchema: {
            issueKey: z.string().describe('The issue key, e.g. NET-1234'),
        },
    },
    async ({ issueKey }) => {
        const attachments = await jira.getAttachments(issueKey);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    attachments.map((a) => ({
                        id: a.id,
                        filename: a.filename,
                        size: a.size,
                        mimeType: a.mimeType,
                        url: a.content,
                        created: a.created,
                    })),
                    null,
                    2,
                ),
            }],
        };
    },
);

// Slack
server.registerTool(
    'slack_list_channels',
    { description: 'List Slack channels (public and private).' },
    async () => {
        const channels = await slack.getChannels();
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(channels.map((c) => ({ id: c.id, name: c.name, members: c.num_members })), null, 2),
            }],
        };
    },
);

server.registerTool(
    'slack_list_users',
    { description: 'List Slack users (excludes bots and deleted accounts).' },
    async () => {
        const users = await slack.getUsers();
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(users.map((u) => ({ id: u.id, name: u.name, realName: u.real_name })), null, 2),
            }],
        };
    },
);

server.registerTool(
    'slack_get_messages',
    {
        description: 'Read recent messages from a Slack channel or DM.',
        inputSchema: {
            channelId: z.string().describe('The channel ID'),
            limit: z.number().optional().describe('Number of messages to fetch (default 20)'),
        },
    },
    async ({ channelId, limit }) => {
        const messages = await slack.getMessages(channelId, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(messages.map((m) => ({ user: m.user, text: m.text, ts: m.ts })), null, 2),
            }],
        };
    },
);

server.registerTool(
    'slack_send_message',
    {
        description: 'Send a message to a Slack channel or DM.',
        inputSchema: {
            channelId: z.string().describe('The channel ID to send to'),
            text: z.string().describe('The message text'),
        },
    },
    async ({ channelId, text }) => {
        const result = await slack.sendMessage(channelId, text);
        return { content: [{ type: 'text', text: `Message sent to ${result.channel} at ${result.ts}.` }] };
    },
);

server.registerTool(
    'slack_get_thread_replies',
    {
        description: 'Get replies in a Slack thread.',
        inputSchema: {
            channelId: z.string().describe('The channel ID'),
            threadTs: z.string().describe('The timestamp of the parent message (ts field)'),
            limit: z.number().optional().describe('Number of replies to fetch (default 20)'),
        },
    },
    async ({ channelId, threadTs, limit }) => {
        const replies = await slack.getThreadReplies(channelId, threadTs, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(replies.map((m) => ({ user: m.user, text: m.text, ts: m.ts })), null, 2),
            }],
        };
    },
);

server.registerTool(
    'slack_open_dm',
    {
        description: 'Open a DM conversation with a user. Returns the DM channel ID.',
        inputSchema: {
            userId: z.string().describe('The Slack user ID'),
        },
    },
    async ({ userId }) => {
        const channelId = await slack.openDM(userId);
        return { content: [{ type: 'text', text: JSON.stringify({ channelId }) }] };
    },
);

server.registerTool(
    'slack_get_file',
    {
        description: 'Download and read the content of a file shared in Slack.',
        inputSchema: {
            fileId: z.string().describe('The Slack file ID'),
        },
    },
    async ({ fileId }) => {
        const file = await slack.getFileContent(fileId);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({ name: file.name, mimetype: file.mimetype, content: file.content }, null, 2),
            }],
        };
    },
);

// Confluence
server.registerTool(
    'confluence_list_spaces',
    {
        description: 'List Confluence spaces.',
        inputSchema: {
            limit: z.number().optional().describe('Max results (default 25)'),
        },
    },
    async ({ limit }) => {
        const spaces = await confluence.getSpaces(limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(spaces.map((s) => ({ id: s.id, key: s.key, name: s.name })), null, 2),
            }],
        };
    },
);

server.registerTool(
    'confluence_get_pages',
    {
        description: 'List pages in a Confluence space.',
        inputSchema: {
            spaceId: z.string().describe('The space ID'),
            limit: z.number().optional().describe('Max results (default 25)'),
        },
    },
    async ({ spaceId, limit }) => {
        const pages = await confluence.getPages(spaceId, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(pages.map((p) => ({ id: p.id, title: p.title })), null, 2),
            }],
        };
    },
);

server.registerTool(
    'confluence_get_page',
    {
        description: 'Get a Confluence page by ID, including its body content.',
        inputSchema: {
            pageId: z.string().describe('The page ID'),
        },
    },
    async ({ pageId }) => {
        const page = await confluence.getPage(pageId);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    {
                        id: page.id,
                        title: page.title,
                        body: page.body?.storage?.value ?? page.body?.view?.value ?? null,
                    },
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'confluence_search',
    {
        description: 'Search Confluence using CQL (Confluence Query Language).',
        inputSchema: {
            cql: z.string().describe('CQL query, e.g. "type=page AND text~roadmap"'),
            limit: z.number().optional().describe('Max results (default 25)'),
        },
    },
    async ({ cql, limit }) => {
        const results = await confluence.search(cql, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    results.map((r) => ({ id: r.content.id, title: r.title, excerpt: r.excerpt })),
                    null,
                    2,
                ),
            }],
        };
    },
);

// GitLab
server.registerTool(
    'gitlab_list_projects',
    {
        description: 'List GitLab projects you have access to. Optionally search by name.',
        inputSchema: {
            search: z.string().optional().describe('Optional search query to filter projects by name'),
            limit: z.number().optional().describe('Max results (default 20)'),
        },
    },
    async ({ search, limit }) => {
        const projects = await gitlab.listProjects(search, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    projects.map((p) => ({
                        id: p.id,
                        name: p.name,
                        path: p.path_with_namespace,
                        description: p.description,
                        defaultBranch: p.default_branch,
                        lastActivity: p.last_activity_at,
                    })),
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'gitlab_get_project',
    {
        description: 'Get details of a GitLab project by ID or URL-encoded path (e.g. "group%2Fproject").',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
        },
    },
    async ({ projectId }) => {
        const project = await gitlab.getProject(projectId);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    {
                        id: project.id,
                        name: project.name,
                        path: project.path_with_namespace,
                        description: project.description,
                        defaultBranch: project.default_branch,
                        webUrl: project.web_url,
                        lastActivity: project.last_activity_at,
                    },
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'gitlab_get_tree',
    {
        description: 'List files and directories in a GitLab repository path.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            path: z.string().optional().describe('Directory path (default: root)'),
            ref: z.string().optional().describe('Branch or tag (default: project default branch)'),
            limit: z.number().optional().describe('Max results (default 100)'),
        },
    },
    async ({ projectId, path, ref, limit }) => {
        const items = await gitlab.getTree(projectId, path, ref, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(items.map((i) => ({ type: i.type, path: i.path, name: i.name })), null, 2),
            }],
        };
    },
);

server.registerTool(
    'gitlab_get_file',
    {
        description: 'Read the content of a file from a GitLab repository.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            filePath: z.string().describe('Path to the file in the repository'),
            ref: z.string().optional().describe('Branch or tag (default: project default branch)'),
        },
    },
    async ({ projectId, filePath, ref }) => {
        const file = await gitlab.getFile(projectId, filePath, ref);
        return { content: [{ type: 'text', text: file.content }] };
    },
);

server.registerTool(
    'gitlab_list_merge_requests',
    {
        description: 'List merge requests for a GitLab project.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            state: z.enum(['opened', 'closed', 'merged', 'all']).optional().describe('Filter by state (default: opened)'),
            limit: z.number().optional().describe('Max results (default 20)'),
        },
    },
    async ({ projectId, state, limit }) => {
        const mrs = await gitlab.listMergeRequests(projectId, state, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    mrs.map((mr) => ({
                        iid: mr.iid,
                        title: mr.title,
                        state: mr.state,
                        author: mr.author.username,
                        sourceBranch: mr.source_branch,
                        targetBranch: mr.target_branch,
                        updatedAt: mr.updated_at,
                        webUrl: mr.web_url,
                    })),
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'gitlab_list_branches',
    {
        description: 'List branches in a GitLab repository.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            search: z.string().optional().describe('Optional search string to filter branches'),
            limit: z.number().optional().describe('Max results (default 50)'),
        },
    },
    async ({ projectId, search, limit }) => {
        const branches = await gitlab.listBranches(projectId, search, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    branches.map((b) => ({
                        name: b.name,
                        default: b.default,
                        protected: b.protected,
                        merged: b.merged,
                        lastCommit: b.commit.title,
                        committedAt: b.commit.committed_date,
                    })),
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'gitlab_list_pipelines',
    {
        description: 'List CI/CD pipelines for a GitLab project.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            ref: z.string().optional().describe('Filter by branch or tag name'),
            status: z.string().optional().describe(
                'Filter by status: created, waiting_for_resource, preparing, pending, running, success, failed, canceled, skipped, manual, scheduled',
            ),
            limit: z.number().optional().describe('Max results (default 20)'),
        },
    },
    async ({ projectId, ref, status, limit }) => {
        const pipelines = await gitlab.listPipelines(projectId, ref, status, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    pipelines.map((p) => ({
                        id: p.id,
                        status: p.status,
                        ref: p.ref,
                        sha: p.sha,
                        createdAt: p.created_at,
                        updatedAt: p.updated_at,
                        webUrl: p.web_url,
                    })),
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'gitlab_create_branch',
    {
        description: 'Create a new branch in a GitLab repository.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            branchName: z.string().describe('Name of the new branch'),
            ref: z.string().describe('Source branch or commit SHA (e.g. "main")'),
        },
    },
    async ({ projectId, branchName, ref }) => {
        await gitlab.createBranch(projectId, branchName, ref);
        return {
            content: [{
                type: 'text',
                text: `Created branch '${branchName}' from '${ref}' in project ${projectId}.`,
            }],
        };
    },
);

server.registerTool(
    'gitlab_create_commit',
    {
        description: 'Create a commit with one or more file changes.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            branch: z.string().describe('Branch to commit to'),
            message: z.string().describe('Commit message'),
            actions: z.array(z.object({
                action: z.enum(['create', 'delete', 'move', 'update']),
                file_path: z.string(),
                content: z.string().optional().describe('Content for create/update actions'),
                previous_path: z.string().optional().describe('Required for move action'),
            })).describe('List of file actions (create, delete, move, update)'),
        },
    },
    async ({ projectId, branch, message, actions }) => {
        await gitlab.createCommit(projectId, branch, message, actions);
        return { content: [{ type: 'text', text: `Created commit on branch '${branch}' in project ${projectId}.` }] };
    },
);

server.registerTool(
    'gitlab_create_merge_request',
    {
        description: 'Create a new merge request.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            sourceBranch: z.string().describe('The source branch'),
            targetBranch: z.string().describe('The target branch'),
            title: z.string().describe('Title of the MR'),
            description: z.string().optional().describe('Description of the MR'),
        },
    },
    async ({ projectId, sourceBranch, targetBranch, title, description }) => {
        const mr = await gitlab.createMergeRequest(projectId, sourceBranch, targetBranch, title, description);
        return { content: [{ type: 'text', text: JSON.stringify(mr, null, 2) }] };
    },
);

server.registerTool(
    'gitlab_update_merge_request',
    {
        description: 'Update an existing merge request (title, description, target branch, assignee).',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            mrIid: z.number().describe('The MR internal ID (iid)'),
            title: z.string().optional().describe('New title'),
            description: z.string().optional().describe('New description'),
            targetBranch: z.string().optional().describe('New target branch'),
            assigneeId: z.number().optional().describe('New assignee user ID'),
        },
    },
    async ({ projectId, mrIid, title, description, targetBranch, assigneeId }) => {
        const mr = await gitlab.updateMergeRequest(projectId, mrIid, {
            title,
            description,
            target_branch: targetBranch,
            assignee_id: assigneeId,
        });
        return { content: [{ type: 'text', text: JSON.stringify({ iid: mr.iid, title: mr.title, web_url: mr.web_url }, null, 2) }] };
    },
);

server.registerTool(
    'gitlab_get_pipeline_jobs',
    {
        description: 'List jobs for a specific pipeline.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            pipelineId: z.number().describe('Pipeline ID'),
        },
    },
    async ({ projectId, pipelineId }) => {
        const jobs = await gitlab.getPipelineJobs(projectId, pipelineId);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    jobs.map((j) => ({
                        id: j.id,
                        name: j.name,
                        stage: j.stage,
                        status: j.status,
                        duration: j.duration,
                        webUrl: j.web_url,
                    })),
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'gitlab_get_job_log',
    {
        description: 'Get the full log output of a CI/CD job.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            jobId: z.number().describe('Job ID'),
        },
    },
    async ({ projectId, jobId }) => {
        const log = await gitlab.getJobLog(projectId, jobId);
        return { content: [{ type: 'text', text: log }] };
    },
);

server.registerTool(
    'gitlab_get_merge_request_diff',
    {
        description: 'Get the file diffs of a merge request.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            mrIid: z.number().describe('The MR internal ID (iid)'),
        },
    },
    async ({ projectId, mrIid }) => {
        const diffs = await gitlab.getMergeRequestDiff(projectId, mrIid);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    diffs.map((d) => ({
                        oldPath: d.old_path,
                        newPath: d.new_path,
                        newFile: d.new_file,
                        deletedFile: d.deleted_file,
                        renamedFile: d.renamed_file,
                        diff: d.diff,
                    })),
                    null,
                    2,
                ),
            }],
        };
    },
);

server.registerTool(
    'gitlab_get_merge_request_comments',
    {
        description: 'Get comments/notes on a merge request.',
        inputSchema: {
            projectId: z.string().describe('Project ID or URL-encoded path'),
            mrIid: z.number().describe('The MR internal ID (iid)'),
            limit: z.number().optional().describe('Max results (default 50)'),
        },
    },
    async ({ projectId, mrIid, limit }) => {
        const notes = await gitlab.getMergeRequestComments(projectId, mrIid, limit);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(
                    notes
                        .filter((n) => !n.system)
                        .map((n) => ({
                            id: n.id,
                            author: n.author.username,
                            body: n.body,
                            createdAt: n.created_at,
                            resolvable: n.resolvable,
                            resolved: n.resolved,
                        })),
                    null,
                    2,
                ),
            }],
        };
    },
);

// MariaDB
server.registerTool(
    'mariadb_query',
    {
        description: 'Execute a read-only SQL query (SELECT, SHOW, DESCRIBE, EXPLAIN) against the MariaDB database.',
        inputSchema: {
            sql: z.string().describe('The SQL query to execute'),
        },
    },
    async ({ sql }) => {
        const rows = await mariadb.query(sql);
        return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
    },
);

const transport = new StdioServerTransport();
await server.connect(transport);
