import '@std/dotenv/load';
import type { ElasticsearchConfig } from './elasticsearch/types.ts';
import type { GitLabConfig } from './gitlab/types.ts';
import type { JiraConfig } from './jira/types.ts';
import type { MariaDbConfig } from './mariadb/types.ts';
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

export function loadGitLabConfig(): GitLabConfig {
    return {
        baseUrl: requireEnv('GITLAB_BASE_URL').replace(/\/+$/, ''),
        token: requireEnv('GITLAB_TOKEN'),
    };
}

export function loadMariaDbConfig(): MariaDbConfig {
    return {
        hostname: requireEnv('DB_HOSTNAME'),
        username: requireEnv('DB_USERNAME'),
        password: requireEnv('DB_PASSWORD'),
        database: requireEnv('DB_DATABASE'),
    };
}

export function loadElasticsearchConfig(): ElasticsearchConfig {
    return {
        apiUrl: requireEnv('ELASTICSEARCH_API_URL').replace(/\/+$/, ''),
        apiKey: requireEnv('ELASTICSEARCH_API_KEY'),
    };
}
