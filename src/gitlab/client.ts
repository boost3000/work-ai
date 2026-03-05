import type { GitLabConfig, GitLabFile, GitLabProject, GitLabTreeItem } from './types.ts';

export class GitLabClient {
    private baseUrl: string;
    private token: string;

    constructor(config: GitLabConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, '');
        this.token = config.token;
    }

    private async request<T>(path: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}/api/v4${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'PRIVATE-TOKEN': this.token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options?.headers,
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

    async createBranch(projectId: string | number, branchName: string, ref: string): Promise<void> {
        await this.request(`/projects/${encodeURIComponent(projectId)}/repository/branches`, {
            method: 'POST',
            body: JSON.stringify({
                branch: branchName,
                ref: ref,
            }),
        });
    }

    async createCommit(
        projectId: string | number,
        branch: string,
        message: string,
        actions: { action: 'create' | 'delete' | 'move' | 'update'; file_path: string; content?: string }[],
    ): Promise<void> {
        await this.request(`/projects/${encodeURIComponent(projectId)}/repository/commits`, {
            method: 'POST',
            body: JSON.stringify({
                branch,
                commit_message: message,
                actions,
            }),
        });
    }

    async createMergeRequest(
        projectId: string | number,
        sourceBranch: string,
        targetBranch: string,
        title: string,
        description?: string,
    ): Promise<{ web_url: string }> {
        return await this.request<{ web_url: string }>(`/projects/${encodeURIComponent(projectId)}/merge_requests`, {
            method: 'POST',
            body: JSON.stringify({
                source_branch: sourceBranch,
                target_branch: targetBranch,
                title,
                description,
            }),
        });
    }
}
