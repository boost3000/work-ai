import '@std/dotenv/load';
import type { JiraConfig } from './jira/types.ts';
import type { SlackConfig } from './slack/types.ts';

function requireEnv(name: string): string {
    const value = Deno.env.get(name);
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export function loadJiraConfig(): JiraConfig {
    return {
        baseUrl: requireEnv('JIRA_BASE_URL').replace(/\/+$/, ''),
        email: requireEnv('JIRA_EMAIL'),
        apiToken: requireEnv('JIRA_API_TOKEN'),
    };
}

export function loadSlackConfig(): SlackConfig {
    return {
        token: requireEnv('SLACK_TOKEN'),
    };
}
