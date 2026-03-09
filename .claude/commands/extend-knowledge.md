# Extend your knowledge about the company and projects by fetching fresh data from all available sources

Run the following steps in parallel where possible:

1. **Jira** — Fetch open issues assigned to me. Also fetch recently updated issues across all projects (last 14 days). Fetch current sprint via jira_get_boards → jira_get_sprints.
2. **Slack** — Search recent messages (last 14 days) with `after:<14-days-ago>` via slack_search_messages. Also fetch recent messages from any open DM channels.
3. **GitLab** — List MRs assigned to or created by me across all projects. Check pipeline status on active branches. Note any failed pipelines or open review requests.
4. **Confluence** — Search for pages modified in the last 14 days using CQL: `lastModified > now("-14d") order by lastModified desc`.
5. **People** — Refresh people.md using slack_list_users and jira_search_users if the file is older than 7 days.
6. **Save** — Update .knowledge files: _ai_recent_activity.md, projects.md, company.md, people.md, slack_channels.md as needed. Replace outdated entries, never append duplicates.

Be thorough but concise. Prioritize information relevant to active work.
