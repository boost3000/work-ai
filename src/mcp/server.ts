import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { loadElasticsearchConfig, loadGitLabConfig, loadJiraConfig, loadLokiConfig, loadMariaDbConfig, loadSlackConfig } from '../config.ts';
import { ElasticsearchClient } from '../tools/elasticsearch/client.ts';
import { GitLabClient } from '../tools/gitlab/client.ts';
import { JiraClient } from '../tools/jira/client.ts';
import { LokiClient } from '../tools/loki/client.ts';
import { MariaDbClient } from '../tools/mariadb/client.ts';
import { SlackClient } from '../tools/slack/client.ts';
import { ConfluenceClient } from '../tools/confluence/client.ts';

import { registerJiraTools } from './tools/jira.ts';
import { registerSlackTools } from './tools/slack.ts';
import { registerConfluenceTools } from './tools/confluence.ts';
import { registerGitLabTools } from './tools/gitlab.ts';
import { registerMariaDbTools } from './tools/mariadb.ts';
import { registerElasticsearchTools } from './tools/elasticsearch.ts';
import { registerLokiTools } from './tools/loki.ts';

const jiraConfig = loadJiraConfig();
const jira = new JiraClient(jiraConfig);
const slack = new SlackClient(loadSlackConfig());
const confluence = new ConfluenceClient(jiraConfig);
const gitlab = new GitLabClient(loadGitLabConfig());
const mariadb = new MariaDbClient(loadMariaDbConfig());
const elasticsearch = new ElasticsearchClient(loadElasticsearchConfig());
const loki = new LokiClient(loadLokiConfig());

const server = new McpServer({ name: 'work-ai', version: '1.0.0' });

registerJiraTools(server, jira);
registerSlackTools(server, slack);
registerConfluenceTools(server, confluence);
registerGitLabTools(server, gitlab);
registerMariaDbTools(server, mariadb);
registerElasticsearchTools(server, elasticsearch);
registerLokiTools(server, loki);

const transport = new StdioServerTransport();
await server.connect(transport);
