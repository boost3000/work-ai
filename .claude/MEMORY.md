# work-ai Memory

## Project Overview

- Work automation workflow tool built with **Deno**
- Formatting: no tabs, 4-space indent, semicolons, single quotes, 120 line width

## Architecture

- `src/mod.ts` — public re-exports
- `src/config.ts` — loads `.env` via `@std/dotenv`, exports typed config loaders
- `src/jira/client.ts` — `JiraClient` class wrapping Jira Cloud REST API v3 (basic auth)
- `src/jira/types.ts` — TypeScript types for Jira API entities
- `src/jira/smoke.ts` — quick smoke test script (`deno task jira`)
- `src/slack/client.ts` — `SlackClient` class wrapping Slack Web API (Bearer token auth)
- `src/slack/types.ts` — TypeScript types for Slack API entities
- `src/slack/smoke.ts` — quick smoke test script (`deno task slack`)
- `src/confluence/client.ts` — `ConfluenceClient` wrapping Confluence Cloud API v2 + v1 search (basic auth)
- `src/confluence/types.ts` — TypeScript types for Confluence API entities
- `src/confluence/smoke.ts` — quick smoke test script (`deno task confluence`)
- `src/mcp/server.ts` — MCP stdio server exposing all clients as Claude Code tools
- `.mcp.json` — project-scoped MCP config for Claude Code auto-discovery

## Key Decisions

- Jira Cloud with basic auth (email + API token)
- Slack with User Token (xoxp-) auth
- Confluence reuses Jira credentials (same Atlassian Cloud instance)
- Config via `.env` file (gitignored), template in `.env.example`
- No third-party SDKs — plain fetch with typed wrappers
- Jira search uses new `POST /search/jql` endpoint (old `/search` was removed)
- Confluence uses v2 API for spaces/pages, v1 for CQL search
