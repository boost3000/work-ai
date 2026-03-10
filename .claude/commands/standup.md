# Prepare a standup summary for me

**Step 1 — Load context:**
- Check `.knowledge/` for cached Jira and Slack data and whether it's from today
- If fresh, use it directly — skip API calls
- If stale, fetch my Jira issues updated in the last 14 days + recent messages in #development, #projekt_4np, #team_4netplayers (last 7 days), then save to `.knowledge/`

**Step 2 — Format:**

- **Last week**: what was done
- **Next week**: what I plan to work on
- **Blockers**: anything blocking progress

Keep it brief and in first person, ready to paste into Slack.
