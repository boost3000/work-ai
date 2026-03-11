import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { LokiClient } from '../../tools/loki/client.ts';

export function registerLokiTools(server: McpServer, loki: LokiClient): void {
    server.registerTool(
        'loki_query_logs',
        {
            description: 'Query Fleet application logs from Grafana Loki using LogQL. Use labels like {app_id="..."}, {service_name="..."}, {container_name="..."} etc.',
            inputSchema: {
                query: z.string().describe('LogQL query, e.g. {app_id="abc123"} |= "error"'),
                from: z.string().optional().describe('Start time as ISO 8601 string, e.g. 2026-03-09T00:00:00Z. Defaults to 1 hour ago.'),
                to: z.string().optional().describe('End time as ISO 8601 string. Defaults to now.'),
                limit: z.number().optional().describe('Max number of log lines to return (default 100, max 1000)'),
                direction: z.enum(['forward', 'backward']).optional().describe('Sort direction. backward = newest first (default)'),
            },
        },
        async ({ query, from, to, limit, direction }) => {
            const entries = await loki.queryRange({ query, from, to, limit, direction });
            return { content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }] };
        },
    );

    server.registerTool(
        'loki_get_label_values',
        {
            description: 'Get all values for a specific Loki label (e.g. all app_ids, service names, container names).',
            inputSchema: {
                label: z.string().describe('Label name, e.g. "app_id", "service_name", "container_name"'),
            },
        },
        async ({ label }) => {
            const values = await loki.getLabelValues(label);
            return { content: [{ type: 'text', text: JSON.stringify(values, null, 2) }] };
        },
    );
}
