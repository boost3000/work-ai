import '@std/dotenv/load';
import type { ElasticsearchConfig } from './tools/elasticsearch/types.ts';
import type { GitLabConfig } from './tools/gitlab/types.ts';
import type { JiraConfig } from './tools/jira/types.ts';
import type { LokiConfig } from './tools/loki/types.ts';
import type { MariaDbConfig } from './tools/mariadb/types.ts';
import type { SlackConfig } from './tools/slack/types.ts';

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

export function loadLokiConfig(): LokiConfig {
    return {
        baseUrl: requireEnv('FLEET_GRAFANA_URL').replace(/\/+$/, ''),
        username: requireEnv('FLEET_GRAFANA_USERNAME'),
        password: requireEnv('FLEET_GRAFANA_PASSWORD'),
        datasourceUid: 'de5wbhqm9pa0we',
    };
}
