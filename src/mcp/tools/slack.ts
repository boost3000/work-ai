import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SlackClient } from '../../tools/slack/client.ts';

export function registerSlackTools(server: McpServer, slack: SlackClient): void {
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

    server.registerTool(
        'slack_search_messages',
        {
            description: 'Search Slack messages by keyword across all channels.',
            inputSchema: {
                query: z.string().describe('Search query text'),
                limit: z.number().optional().describe('Max results (default 20)'),
            },
        },
        async ({ query, limit }) => {
            const matches = await slack.searchMessages(query, limit);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        matches.map((m) => ({
                            channel: m.channel.name,
                            channelId: m.channel.id,
                            user: m.username,
                            text: m.text,
                            ts: m.ts,
                            permalink: m.permalink,
                        })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'slack_add_reaction',
        {
            description: 'Add an emoji reaction to a Slack message.',
            inputSchema: {
                channelId: z.string().describe('The channel ID'),
                ts: z.string().describe('Timestamp of the message to react to'),
                emoji: z.string().describe('Emoji name without colons, e.g. "thumbsup", "white_check_mark"'),
            },
        },
        async ({ channelId, ts, emoji }) => {
            await slack.addReaction(channelId, ts, emoji);
            return { content: [{ type: 'text', text: `Added :${emoji}: reaction to message ${ts}.` }] };
        },
    );
}
