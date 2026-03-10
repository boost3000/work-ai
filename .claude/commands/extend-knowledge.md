# Extend your knowledge about the company and projects by fetching fresh data from all available sources

First, check the `.knowledge/` folder for existing files and their freshness (look for a last-updated tracker or file timestamps). Skip sources that are still fresh — use 1-hour TTL for activity data, 1-day TTL for stable data (people, projects, boards).

Run the following steps in parallel where possible (only for stale sources):

1. **Jira (my issues)** — Fetch open issues assigned to me. Also fetch recently updated issues across all projects (last 14 days).
2. **Jira (boards/sprint)** — If stale: fetch boards and active sprint for the NET board.
3. **Slack** — Search recent messages (last 14 days) via `slack_search_messages`. Also fetch recent messages from key channels.
4. **GitLab** — If stale: list projects. Always check open MRs and pipeline status on active branches.
5. **Confluence** — Search pages modified in the last 14 days: `lastModified > now("-14d") order by lastModified desc`.
6. **People** — Refresh people data using `slack_list_users` and `jira_search_users` only if stale (>7 days).

**Save** — Update `.knowledge/` files as needed. Replace outdated entries, never append duplicates. Always update the freshness tracker for every source that was refreshed. Be thorough but concise.
