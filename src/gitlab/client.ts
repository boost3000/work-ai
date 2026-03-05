import type { GitLabConfig, GitLabFile, GitLabProject, GitLabTreeItem } from './types.ts';

export class GitLabClient {
    private baseUrl: string;
    private token: string;

    constructor(config: GitLabConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, '');
        this.token = config.token;
    }

    private async request<T>(path: string): Promise<T> {
        const url = `${this.baseUrl}/api/v4${path}`;
        const response = await fetch(url, {
            headers: {
                'PRIVATE-TOKEN': this.token,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`GitLab API error ${response.status} ${response.statusText}: ${body}`);
        }

        return response.json() as Promise<T>;
    }

    listProjects(search?: string, limit = 20): Promise<GitLabProject[]> {
        const params = new URLSearchParams({
            membership: 'true',
            per_page: String(limit),
            order_by: 'last_activity_at',
        });
        if (search) params.set('search', search);
        return this.request<GitLabProject[]>(`/projects?${params}`);
    }

    getProject(projectId: string | number): Promise<GitLabProject> {
        return this.request<GitLabProject>(`/projects/${encodeURIComponent(projectId)}`);
    }

    getTree(projectId: string | number, path = '', ref?: string, limit = 100): Promise<GitLabTreeItem[]> {
        const params = new URLSearchParams({
            per_page: String(limit),
            recursive: 'false',
        });
        if (path) params.set('path', path);
        if (ref) params.set('ref', ref);
        return this.request<GitLabTreeItem[]>(
            `/projects/${encodeURIComponent(projectId)}/repository/tree?${params}`,
        );
    }

    async getFile(projectId: string | number, filePath: string, ref?: string): Promise<GitLabFile> {
        const params = ref ? `?ref=${encodeURIComponent(ref)}` : '';
        const file = await this.request<GitLabFile>(
            `/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}${params}`,
        );
        file.content = atob(file.content);
        return file;
    }
}
