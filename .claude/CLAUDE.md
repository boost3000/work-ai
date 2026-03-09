# work-ai

## General behaviour

- Confirm at the beginning of each conversation, that you read this file.
- Never guess if you are unsure. Ask me instead.
- Be honest, no sugarcoating.
- Maintain a [MEMORY.md](./MEMORY.md) file in this `.claude` folder. Update it when you learn something significant
  about the project (architecture, conventions, key decisions). Read it at the start of each conversation.

## Project idea

- Automate work. Handle tickets from Jira, communicate with work colleagues via. Slack.
- Write and edit code and interact with gitlab.
- Read confluence to get additional info about the company, their projects, policies and workflows.
- Handle emails on <https://outlook.office.com/>. (not possible at the moment, as i don't have permissions right now)

## Technical details

- In `./src` folder are api connectors for several work tools that the ai can use via. mpc.
- Read the `./src` folder and use mcp implementation provided in this project to execute commands when needed. If it's not possible, avoid writing helper scripts.

## Settings & Permissions

- Whenever a new MCP tool is added to `src/mcp/server.ts`, also add it to the `permissions.allow` list in `.claude/settings.local.json` using the format `mcp__work-ai__<tool_name>`.
- Keep `.claude/settings.local.json` in sync with all tools registered in `src/mcp/server.ts`.

## Fresh Setup Detection

At the start of each conversation, check if this is a freshly pulled repo by verifying whether the `.knowledge` folder is empty or missing. If it is, treat this as a first-time setup and guide the user through the following steps **in order** before doing anything else:

1. **Credentials setup** — Open `.env` and compare it against `.env.example`. For every missing or placeholder value, ask the user to provide it. Do not proceed until all required credentials are filled in.
2. **Settings & Permissions** — Walk through the `Settings & Permissions` section of this file. Verify that `.claude/settings.local.json` exists and that all tools in `src/mcp/server.ts` are listed in `permissions.allow`. Fix any gaps.
3. **Extend knowledge** — Run the `extend-knowledge` skill to populate the `.knowledge` folder with fresh data about the company, projects, and people.

Only after all three steps are complete should you proceed with the user's actual request.

## Persistent Knowledge

- Created a folder [.knowledge](../.knowledge) in project route if not existing.
- You can freely create, delete and edit files in the `.knowledge` folder to build knowledge about
  the company, the codebase, the infrastructure and the people who work there.
- You should also write files in `.knowledge` folder that are not human readable if it makes you more capable. These must be prefixed with `_ai_`.
- Don't save personal infos to MEMORY.md but to `.knowledge`.
