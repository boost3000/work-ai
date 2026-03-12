# work-ai

## Project idea

- Automate work. Handle tickets from Jira, communicate with work colleagues via. Slack.
- Write and edit code and interact with gitlab.
- Read confluence to get additional info about the company, their projects, policies and workflows.
- Read the database, elasticsearch gameserver logs and loki odin fleet logs to gather more information.
- Handle emails on <https://outlook.office.com/>. (not possible at the moment, as i don't have permissions right now)

## Fresh Setup Detection

At the start of each conversation, check if this is a freshly pulled repo by verifying whether the `.knowledge` folder
is empty or missing. If it is, treat this as a first-time setup and guide the user through the following steps **in
order** before doing anything else:

0. **Check Deno** — Verify Deno is installed (`deno --version`). If not, instruct the user to install it from [deno.com](https://deno.com) before proceeding.
1. **Credentials setup** — Run the `/setup-env` skill to guide the user through filling in all required credentials.
2. **Settings & Permissions** — Walk through the `Settings & Permissions` section of this file. Verify that
   `.claude/settings.local.json` exists and that all tools in `src/mcp/server.ts` are listed in `permissions.allow`. Fix
   any gaps.
3. **Extend knowledge** — Run the `extend-knowledge` skill to populate the `.knowledge` folder with fresh data about the
   company, projects, and people.

Only after all three steps are complete should you proceed with the user's actual request.

## General behaviour

- Confirm at the beginning of each conversation, that you read this file.
- Never guess if you are unsure. Ask me instead.
- **Always check the actual current time via `date` before making any timing claims** (e.g. "stuck for X hours", "X
  minutes ago"). Never infer elapsed time from timestamps alone without knowing the current time.
- Be honest, no sugarcoating.
- Maintain a [MEMORY.md](./MEMORY.md) file in this `.claude` folder. Update it when you learn something significant
  about the project (architecture, conventions, key decisions). Read it at the start of each conversation.

## Work Behaviour

- When working on a Jira ticket, always use the ticket ID as the GitLab branch name (e.g. `NET-5451`).
- Only send Slack messages or post comments if explicitly asked.
- Do not push to GitLab or create/merge MRs without explicit confirmation.
- Transition Jira ticket status as work progresses (e.g. move to "In Progress" when starting, "Feedback" when an MR is
  open).
- Before messaging a person on Slack, look up their user ID in `.knowledge/` to avoid querying the API unnecessarily.

## Persistent Knowledge

- Created a folder [.knowledge](../.knowledge) in project route if not existing.
- You can freely create, delete and edit files in the `.knowledge` folder to build knowledge about the company, the
  codebase, the infrastructure and the people who work there.
- You should also write files in `.knowledge` folder that are not human readable if it makes you more capable. These
  must be prefixed with `_ai_`.
- Don't save personal infos to MEMORY.md but to `.knowledge`.

## Technical details

- In `./src` folder are api connectors for several work tools that the ai can use via. mpc.
- Read the `./src` folder and use mcp implementation provided in this project to execute commands when needed. If it's
  not possible, avoid writing helper scripts.

## Settings & Permissions

- Whenever a new MCP tool is added to `src/mcp/server.ts`, also add it to the `permissions.allow` list in
  `.claude/settings.local.json` using the format `mcp__work-ai__<tool_name>`.
- Keep `.claude/settings.local.json` in sync with all tools registered in `src/mcp/server.ts`.
- The Playwright MCP server (`@playwright/mcp`) is configured in `.mcp.json`. All its tools must be listed in
  `permissions.allow` using the format `mcp__playwright__<tool_name>` and `"playwright"` must be in
  `enabledMcpjsonServers`. See the current list of tools in `.claude/settings.local.json`.
- Playwright browsers must be installed once via `npx playwright install` before the MCP server can launch a browser.
  System dependencies also need to be installed via `sudo npx playwright install-deps`.

## Interaction with Database

- Don't guess table names but retreive a list if you are unsure. Same with columns names, get tables structure first and
  don't guess.
