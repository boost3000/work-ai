# Guide the user through setting up the .env file

1. Read `.env.example` to get all required variables.
2. Read `.env` if it exists — identify which variables are missing or still set to placeholder values (e.g. `_`, `your-*`, `example`).
3. For each missing or placeholder variable, explain:
   - What it is and what service it belongs to
   - Where to get it (direct link or steps if known)
   - What permissions/scopes are required for the credential
4. Ask the user to provide the values one service at a time (Jira → Slack → GitLab → MariaDB).
5. Once the user provides a value, write it into `.env` immediately before moving to the next.
6. After all variables are filled in, run the available smoke tests to verify connectivity:
   - `deno task jira`
   - `deno task slack`
   - `deno task confluence`
7. Report which connections succeeded and which failed. For any failure, show the error and suggest the most likely fix (wrong token format, missing permission scope, network/tunnel issue).
