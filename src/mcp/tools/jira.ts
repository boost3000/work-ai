import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { JiraClient } from '../../tools/jira/client.ts';

export function registerJiraTools(server: McpServer, jira: JiraClient): void {
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

    server.registerTool(
        'jira_get_comments',
        {
            description: 'Get comments on a Jira issue.',
            inputSchema: {
                issueKey: z.string().describe('The issue key, e.g. NET-1234'),
            },
        },
        async ({ issueKey }) => {
            const comments = await jira.getComments(issueKey);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        comments.map((c) => ({
                            id: c.id,
                            author: c.author.displayName,
                            created: c.created,
                            body: c.body,
                        })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'jira_get_link_types',
        {
            description: 'List available Jira issue link types (e.g. "blocks", "relates to", "is cloned by").',
        },
        async () => {
            const types = await jira.getIssueLinkTypes();
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        types.map((t) => ({ id: t.id, name: t.name, inward: t.inward, outward: t.outward })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'jira_link_issues',
        {
            description: 'Link two Jira issues together. Use jira_get_link_types to find available link type names.',
            inputSchema: {
                inwardIssueKey: z.string().describe('The inward issue key, e.g. NET-1234'),
                outwardIssueKey: z.string().describe('The outward issue key, e.g. NET-5678'),
                linkTypeName: z.string().describe('Link type name, e.g. "blocks", "relates to", "is cloned by"'),
            },
        },
        async ({ inwardIssueKey, outwardIssueKey, linkTypeName }) => {
            await jira.linkIssues(inwardIssueKey, outwardIssueKey, linkTypeName);
            return {
                content: [{
                    type: 'text',
                    text: `Linked ${inwardIssueKey} → ${outwardIssueKey} with type "${linkTypeName}".`,
                }],
            };
        },
    );
}
