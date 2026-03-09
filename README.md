# work-ai

A personal work automation layer for Claude Code. Exposes Jira, Slack, Confluence, GitLab, and MariaDB as MCP tools so Claude can act as an autonomous work assistant — triaging tickets, communicating with colleagues, reviewing code, and querying infrastructure data.

## What it does

- **Jira** — list, create, update, and transition issues; add comments; link tickets; manage sprints
- **Slack** — read channels and threads, send messages, search messages, manage reactions
- **Confluence** — search spaces and pages, read and write documentation
- **GitLab** — manage branches, commits, merge requests, pipelines, and job logs
- **MariaDB** — run read-only queries (SELECT/SHOW/DESCRIBE/EXPLAIN) against the production DB via tunnel

## Requirements

- [Deno](https://deno.land/) 2.x
- Claude Code CLI
- Credentials for Jira/Confluence (Atlassian Cloud), Slack (User Token), GitLab (Private Token), and MariaDB

## Setup

### Guided setup (recommended)

Open this project in Claude Code and run:

```
/setup-env
```

Claude will walk you through each credential interactively, explain where to get it, verify required permissions, and run smoke tests when done.

### Manual setup

**1. Clone and configure credentials**

```bash
cp .env.example .env
```

Fill in `.env`:

```env
JIRA_BASE_URL=https://yourorg.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=your-api-token        # https://id.atlassian.com/manage-profile/security/api-tokens

SLACK_TOKEN=xoxp-your-token          # User token (xoxp-), not bot token

GITLAB_BASE_URL=https://your-gitlab-instance.com
GITLAB_TOKEN=your-gitlab-pat         # Needs: read_api, write_repository, read_registry

DB_HOSTNAME=your-db-host
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=your-database
```

**Required API permissions:**
- Jira: Read/Write issues, transitions, comments, sprints
- Slack: `channels:read`, `chat:write`, `users:read`, `search:read`, `files:read`, `reactions:write`
- GitLab: `read_api`, `write_repository`, `read_registry`
- MariaDB: read-only SELECT access (enforced in code)

**2. Add permissions for Claude Code**

The `.mcp.json` at the repo root registers the MCP server automatically when Claude Code is opened in this directory. All tool permissions are pre-configured in `.claude/settings.local.json`.

**3. Smoke test connections**

```bash
deno task jira
deno task slack
deno task confluence
```

## Project structure

```
src/
  config.ts              # Loads .env, exports typed config loaders
  mod.ts                 # Public re-exports
  jira/
    client.ts            # JiraClient — Jira Cloud REST API v3 (basic auth)
    types.ts
    smoke.ts
  slack/
    client.ts            # SlackClient — Slack Web API (Bearer token)
    types.ts
    smoke.ts
  confluence/
    client.ts            # ConfluenceClient — Confluence Cloud API v2 + v1 search
    types.ts
    smoke.ts
  gitlab/
    client.ts            # GitLabClient — GitLab API v4 (Private-Token)
    types.ts
    smoke.ts
  mariadb/
    client.ts            # MariaDbClient — mysql2/promise, read-only
    types.ts
  mcp/
    server.ts            # MCP stdio server — registers all tools
```

## How it works

The MCP server (`src/mcp/server.ts`) starts as a stdio subprocess when Claude Code loads this project. It registers all API clients as tools that Claude can call natively during a conversation — no manual API calls or helper scripts needed.

Claude Code auto-discovers the server via `.mcp.json`.

## Code style

4-space indent, semicolons, single quotes, 120-character line width. Formatted with `deno fmt`.
