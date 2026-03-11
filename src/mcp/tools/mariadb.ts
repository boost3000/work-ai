import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MariaDbClient } from '../../tools/mariadb/client.ts';

export function registerMariaDbTools(server: McpServer, mariadb: MariaDbClient): void {
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
}
