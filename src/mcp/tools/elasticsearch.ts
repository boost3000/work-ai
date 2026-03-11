import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ElasticsearchClient } from '../../tools/elasticsearch/client.ts';

export function registerElasticsearchTools(server: McpServer, elasticsearch: ElasticsearchClient): void {
    server.registerTool(
        'elasticsearch_search_logs',
        {
            description: 'Search all gameserver logs in Elasticsearch by message content. Defaults to the last 24 hours if no date range is provided.',
            inputSchema: {
                search: z.string().describe('Search string (wildcard match against message fields)'),
                from: z.string().optional().describe('Start date in YYYY-MM-DD format. Defaults to 24h ago if omitted.'),
                to: z.string().optional().describe('End date in YYYY-MM-DD format. Only used when from is set.'),
                size: z.number().optional().describe('Max number of log entries to return (default 1000).'),
            },
        },
        async ({ search, from, to, size }) => {
            const logs = await elasticsearch.searchLogs({ search, from, to, size });
            return { content: [{ type: 'text', text: JSON.stringify(logs, null, 2) }] };
        },
    );

    server.registerTool(
        'elasticsearch_search_gameserver_logs',
        {
            description: 'Search gameserver logs in Elasticsearch. Defaults to the last 24 hours if no date range is provided.',
            inputSchema: {
                gid: z.number().describe('Gameserver ID'),
                search: z.string().optional().describe('Optional search string (wildcard match against message fields)'),
                from: z.string().optional().describe('Start date in YYYY-MM-DD format. Defaults to 24h ago if omitted.'),
                to: z.string().optional().describe('End date in YYYY-MM-DD format. Only used when from is set.'),
                size: z.number().optional().describe('Max number of log entries to return (default 1000).'),
            },
        },
        async ({ gid, search, from, to, size }) => {
            const logs = await elasticsearch.searchGameserverLogs(gid, { search, from, to, size });
            return { content: [{ type: 'text', text: JSON.stringify(logs, null, 2) }] };
        },
    );
}
