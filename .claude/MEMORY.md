# work-ai Memory

## Project Overview

- Work automation workflow tool built with **Deno**
- Formatting: no tabs, 4-space indent, semicolons, single quotes, 120 line width

## Architecture

- `src/mod.ts` — public re-exports
- `src/config.ts` — loads `.env` via `@std/dotenv`, exports typed config loaders
- `src/tools/jira/client.ts` — `JiraClient` class wrapping Jira Cloud REST API v3 (basic auth)
- `src/tools/jira/types.ts` — TypeScript types for Jira API entities
- `src/tools/jira/smoke.ts` — quick smoke test script (`deno task jira`)
- `src/tools/slack/client.ts` — `SlackClient` class wrapping Slack Web API (Bearer token auth)
- `src/tools/slack/types.ts` — TypeScript types for Slack API entities
- `src/tools/slack/smoke.ts` — quick smoke test script (`deno task slack`)
- `src/tools/confluence/client.ts` — `ConfluenceClient` wrapping Confluence Cloud API v2 + v1 search (basic auth)
- `src/tools/confluence/types.ts` — TypeScript types for Confluence API entities
- `src/tools/confluence/smoke.ts` — quick smoke test script (`deno task confluence`)
- `src/tools/gitlab/client.ts` — `GitLabClient` class wrapping GitLab API v4 (Private-Token auth)
- `src/tools/gitlab/types.ts` — TypeScript types for GitLab API entities
- `src/tools/gitlab/smoke.ts` — quick smoke test script
- `src/tools/mariadb/client.ts` — `MariaDbClient` using `mysql2/promise` (read-only: SELECT/SHOW/DESCRIBE/EXPLAIN)
- `src/tools/mariadb/types.ts` — TypeScript types for MariaDB config
- `src/mcp/server.ts` — MCP stdio server exposing all clients as Claude Code tools
- `.mcp.json` — project-scoped MCP config for Claude Code auto-discovery

## Key Decisions

- Jira Cloud with basic auth (email + API token)
- Slack with User Token (xoxp-) auth
- Confluence reuses Jira credentials (same Atlassian Cloud instance)
- GitLab self-hosted at gitlab.4players.de, uses Private-Token auth; API v4
- MariaDB via. tunnel and credentials via .env
- Config via `.env` file (gitignored), template in `.env.example`
- No third-party SDKs — plain fetch with typed wrappers (except mysql2 for MariaDB)
- Jira search uses new `POST /search/jql` endpoint (old `/search` was removed)
- Confluence uses v2 API for spaces/pages, v1 for CQL search

## Workflow Rules

- When transitioning a Jira ticket to **Feedback**, also reassign it to the **reporter** (not the User) so it lands in their queue.
