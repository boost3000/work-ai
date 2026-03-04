import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { loadJiraConfig, loadSlackConfig } from '../config.ts';
import { JiraClient } from '../jira/client.ts';
import { SlackClient } from '../slack/client.ts';
import { ConfluenceClient } from '../confluence/client.ts';

const jiraConfig = loadJiraConfig();
const jira = new JiraClient(jiraConfig);
const slack = new SlackClient(loadSlackConfig());
const confluence = new ConfluenceClient(jiraConfig);

const server = new Server(
    { name: 'work-ai', version: '1.0.0' },
    { capabilities: { tools: {} } },
);

const tools = [
    // Jira
    {
        name: 'jira_list_issues',
        description: 'List my open Jira issues. Returns key, summary, status for each issue.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                jql: {
                    type: 'string',
                    description: 'Optional JQL query. Defaults to open issues assigned to me, ordered by last update.',
                },
                maxResults: { type: 'number', description: 'Max results to return (default 50)' },
            },
        },
    },
    {
        name: 'jira_get_issue',
        description: 'Get details of a single Jira issue by key (e.g. NET-1234).',
        inputSchema: {
            type: 'object' as const,
            properties: {
                issueKey: { type: 'string', description: 'The issue key, e.g. NET-1234' },
            },
            required: ['issueKey'],
        },
    },
    {
        name: 'jira_get_transitions',
        description: 'List available status transitions for a Jira issue.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                issueKey: { type: 'string', description: 'The issue key, e.g. NET-1234' },
            },
            required: ['issueKey'],
        },
    },
    {
        name: 'jira_transition_issue',
        description:
            'Move a Jira issue to a different status. Use jira_get_transitions first to find the transition ID.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                issueKey: { type: 'string', description: 'The issue key, e.g. NET-1234' },
                transitionId: { type: 'string', description: 'The transition ID to apply' },
            },
            required: ['issueKey', 'transitionId'],
        },
    },
    // Slack
    {
        name: 'slack_list_channels',
        description: 'List Slack channels (public and private).',
        inputSchema: { type: 'object' as const, properties: {} },
    },
    {
        name: 'slack_list_users',
        description: 'List Slack users (excludes bots and deleted accounts).',
        inputSchema: { type: 'object' as const, properties: {} },
    },
    {
        name: 'slack_get_messages',
        description: 'Read recent messages from a Slack channel or DM.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                channelId: { type: 'string', description: 'The channel ID' },
                limit: { type: 'number', description: 'Number of messages to fetch (default 20)' },
            },
            required: ['channelId'],
        },
    },
    {
        name: 'slack_send_message',
        description: 'Send a message to a Slack channel or DM.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                channelId: { type: 'string', description: 'The channel ID to send to' },
                text: { type: 'string', description: 'The message text' },
            },
            required: ['channelId', 'text'],
        },
    },
    {
        name: 'slack_open_dm',
        description: 'Open a DM conversation with a user. Returns the DM channel ID.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                userId: { type: 'string', description: 'The Slack user ID' },
            },
            required: ['userId'],
        },
    },
    // Confluence
    {
        name: 'confluence_list_spaces',
        description: 'List Confluence spaces.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                limit: { type: 'number', description: 'Max results (default 25)' },
            },
        },
    },
    {
        name: 'confluence_get_pages',
        description: 'List pages in a Confluence space.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                spaceId: { type: 'string', description: 'The space ID' },
                limit: { type: 'number', description: 'Max results (default 25)' },
            },
            required: ['spaceId'],
        },
    },
    {
        name: 'confluence_get_page',
        description: 'Get a Confluence page by ID, including its body content.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                pageId: { type: 'string', description: 'The page ID' },
            },
            required: ['pageId'],
        },
    },
    {
        name: 'confluence_search',
        description: 'Search Confluence using CQL (Confluence Query Language).',
        inputSchema: {
            type: 'object' as const,
            properties: {
                cql: { type: 'string', description: 'CQL query, e.g. "type=page AND text~roadmap"' },
                limit: { type: 'number', description: 'Max results (default 25)' },
            },
            required: ['cql'],
        },
    },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

// deno-lint-ignore no-explicit-any
type Args = Record<string, any>;

async function handleTool(name: string, args: Args): Promise<string> {
    switch (name) {
        // Jira
        case 'jira_list_issues': {
            const result = await jira.getMyIssues(args.jql, args.maxResults);
            return JSON.stringify(
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
            );
        }
        case 'jira_get_issue': {
            const issue = await jira.getIssue(args.issueKey);
            return JSON.stringify(
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
            );
        }
        case 'jira_get_transitions': {
            const transitions = await jira.getTransitions(args.issueKey);
            return JSON.stringify(transitions.map((t) => ({ id: t.id, name: t.name, to: t.to.name })), null, 2);
        }
        case 'jira_transition_issue': {
            await jira.transitionIssue(args.issueKey, args.transitionId);
            return `Transitioned ${args.issueKey} successfully.`;
        }

        // Slack
        case 'slack_list_channels': {
            const channels = await slack.getChannels();
            return JSON.stringify(channels.map((c) => ({ id: c.id, name: c.name, members: c.num_members })), null, 2);
        }
        case 'slack_list_users': {
            const users = await slack.getUsers();
            return JSON.stringify(users.map((u) => ({ id: u.id, name: u.name, realName: u.real_name })), null, 2);
        }
        case 'slack_get_messages': {
            const messages = await slack.getMessages(args.channelId, args.limit);
            return JSON.stringify(messages.map((m) => ({ user: m.user, text: m.text, ts: m.ts })), null, 2);
        }
        case 'slack_send_message': {
            const result = await slack.sendMessage(args.channelId, args.text);
            return `Message sent to ${result.channel} at ${result.ts}.`;
        }
        case 'slack_open_dm': {
            const channelId = await slack.openDM(args.userId);
            return JSON.stringify({ channelId });
        }

        // Confluence
        case 'confluence_list_spaces': {
            const spaces = await confluence.getSpaces(args.limit);
            return JSON.stringify(spaces.map((s) => ({ id: s.id, key: s.key, name: s.name })), null, 2);
        }
        case 'confluence_get_pages': {
            const pages = await confluence.getPages(args.spaceId, args.limit);
            return JSON.stringify(pages.map((p) => ({ id: p.id, title: p.title })), null, 2);
        }
        case 'confluence_get_page': {
            const page = await confluence.getPage(args.pageId);
            return JSON.stringify(
                {
                    id: page.id,
                    title: page.title,
                    body: page.body?.storage?.value ?? page.body?.view?.value ?? null,
                },
                null,
                2,
            );
        }
        case 'confluence_search': {
            const results = await confluence.search(args.cql, args.limit);
            return JSON.stringify(
                results.map((r) => ({
                    id: r.content.id,
                    title: r.title,
                    excerpt: r.excerpt,
                })),
                null,
                2,
            );
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        const text = await handleTool(name, args ?? {});
        return { content: [{ type: 'text', text }] };
    } catch (error) {
        return {
            isError: true,
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
