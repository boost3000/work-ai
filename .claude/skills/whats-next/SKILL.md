---
name: whats-next
description: Look at my current Jira issues and recent Slack activity, then recommend what I should work on next
disable-model-invocation: true
---

# Look at my current Jira issues and recent Slack activity, then recommend what I should work on next

**Step 1 — Load context:**
- Check `.knowledge/` for cached Jira and Slack data and whether it's from today
- If fresh, use it directly — skip API calls
- If stale, fetch open Jira issues assigned to me + recent messages in #development, #projekt_4np, #team_4netplayers (last 7 days), then save to `.knowledge/`

**Step 2 — Recommend:**
- Consider urgency, dependencies, and what the team is discussing
- Give one clear recommendation with brief reasoning
- List 2-3 alternatives if relevant
