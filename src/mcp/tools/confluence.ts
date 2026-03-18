import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConfluenceClient } from '../../tools/confluence/client.ts';

export function registerConfluenceTools(server: McpServer, confluence: ConfluenceClient): void {
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
                        results
                            .filter((r): r is typeof r & { content: NonNullable<typeof r.content> } => r.content != null)
                            .map((r) => ({ id: r.content.id, title: r.title, excerpt: r.excerpt })),
                        null,
                        2,
                    ),
                }],
            };
        },
    );

    server.registerTool(
        'confluence_create_page',
        {
            description: 'Create a new Confluence page in a space. Content should be Confluence Storage Format (HTML-like XML).',
            inputSchema: {
                spaceId: z.string().describe('The space ID (numeric, from confluence_list_spaces)'),
                title: z.string().describe('Page title'),
                content: z.string().describe('Page body in Confluence Storage Format (e.g. "<p>Hello world</p>")'),
                parentId: z.string().optional().describe('Optional parent page ID to nest this page under'),
            },
        },
        async ({ spaceId, title, content, parentId }) => {
            const page = await confluence.createPage(spaceId, title, content, parentId);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ id: page.id, title: page.title, webUrl: page._links.webui }, null, 2),
                }],
            };
        },
    );

    server.registerTool(
        'confluence_update_page',
        {
            description: 'Update an existing Confluence page. Requires the current version number (from confluence_get_page).',
            inputSchema: {
                pageId: z.string().describe('The page ID'),
                title: z.string().describe('Page title (can be unchanged)'),
                content: z.string().describe('New page body in Confluence Storage Format'),
                version: z.number().describe('Current version number of the page (will be incremented by 1)'),
            },
        },
        async ({ pageId, title, content, version }) => {
            const page = await confluence.updatePage(pageId, title, content, version);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(
                        { id: page.id, title: page.title, version: page.version?.number, webUrl: page._links.webui },
                        null,
                        2,
                    ),
                }],
            };
        },
    );
}
