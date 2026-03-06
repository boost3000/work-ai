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

## Persistent Knowledge

- Created a folder [.knowledge](../.knowledge) in project route if not existing.
- You can freely create, delete and edit files in the `.knowledge` folder to build knowledge about
  the company, the codebase, the infrastructure and the people who work there.
- You should also write files in `.knowledge` folder that are not human readable if it makes you more capable. These must be prefixed with `_ai_`.
