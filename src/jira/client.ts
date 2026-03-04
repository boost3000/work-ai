import type { JiraConfig, JiraIssue, JiraSearchResult, JiraTransition, JiraTransitionsResponse } from './types.ts';

export class JiraClient {
    private baseUrl: string;
    private authHeader: string;

    constructor(config: JiraConfig) {
        this.baseUrl = config.baseUrl;
        this.authHeader = 'Basic ' + btoa(`${config.email}:${config.apiToken}`);
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}/rest/api/3${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': this.authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Jira API error ${response.status} ${response.statusText}: ${body}`);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return response.json() as Promise<T>;
    }

    getMyIssues(
        jql = 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC',
        maxResults = 50,
    ): Promise<JiraSearchResult> {
        return this.request<JiraSearchResult>(`/search/jql`, {
            method: 'POST',
            body: JSON.stringify({
                jql,
                maxResults,
                fields: [
                    'summary',
                    'status',
                    'assignee',
                    'reporter',
                    'priority',
                    'project',
                    'issuetype',
                    'labels',
                    'created',
                    'updated',
                ],
            }),
        });
    }

    getIssue(issueKey: string): Promise<JiraIssue> {
        return this.request<JiraIssue>(`/issue/${encodeURIComponent(issueKey)}`);
    }

    async getTransitions(issueKey: string): Promise<JiraTransition[]> {
        const result = await this.request<JiraTransitionsResponse>(
            `/issue/${encodeURIComponent(issueKey)}/transitions`,
        );
        return result.transitions;
    }

    async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
        await this.request(`/issue/${encodeURIComponent(issueKey)}/transitions`, {
            method: 'POST',
            body: JSON.stringify({ transition: { id: transitionId } }),
        });
    }
}
