import type {
    GitLabBranch,
    GitLabCommit,
    GitLabConfig,
    GitLabFile,
    GitLabJob,
    GitLabMergeRequest,
    GitLabMRDiff,
    GitLabMRNote,
    GitLabPipeline,
    GitLabProject,
    GitLabTreeItem,
} from './types.ts';

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

    listMergeRequests(
        projectId: string | number,
        state: 'opened' | 'closed' | 'merged' | 'all' = 'opened',
        limit = 20,
    ): Promise<GitLabMergeRequest[]> {
        const params = new URLSearchParams({ state, per_page: String(limit) });
        return this.request<GitLabMergeRequest[]>(
            `/projects/${encodeURIComponent(projectId)}/merge_requests?${params}`,
        );
    }

    listBranches(projectId: string | number, search?: string, limit = 50): Promise<GitLabBranch[]> {
        const params = new URLSearchParams({ per_page: String(limit) });
        if (search) params.set('search', search);
        return this.request<GitLabBranch[]>(
            `/projects/${encodeURIComponent(projectId)}/repository/branches?${params}`,
        );
    }

    listPipelines(
        projectId: string | number,
        ref?: string,
        status?: string,
        limit = 20,
    ): Promise<GitLabPipeline[]> {
        const params = new URLSearchParams({ per_page: String(limit) });
        if (ref) params.set('ref', ref);
        if (status) params.set('status', status);
        return this.request<GitLabPipeline[]>(
            `/projects/${encodeURIComponent(projectId)}/pipelines?${params}`,
        );
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

    async updateMergeRequest(
        projectId: string | number,
        mrIid: number,
        fields: { title?: string; description?: string; target_branch?: string; assignee_id?: number },
    ): Promise<GitLabMergeRequest> {
        return await this.request<GitLabMergeRequest>(
            `/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}`,
            { method: 'PUT', body: JSON.stringify(fields) },
        );
    }

    getPipelineJobs(projectId: string | number, pipelineId: number): Promise<GitLabJob[]> {
        return this.request<GitLabJob[]>(
            `/projects/${encodeURIComponent(projectId)}/pipelines/${pipelineId}/jobs`,
        );
    }

    async getJobLog(projectId: string | number, jobId: number): Promise<string> {
        const url = `${this.baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/jobs/${jobId}/trace`;
        const response = await fetch(url, {
            headers: { 'PRIVATE-TOKEN': this.token, 'Accept': 'text/plain' },
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`GitLab API error ${response.status} ${response.statusText}: ${body}`);
        }
        return response.text();
    }

    getMergeRequestDiff(projectId: string | number, mrIid: number): Promise<GitLabMRDiff[]> {
        return this.request<GitLabMRDiff[]>(
            `/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/diffs`,
        );
    }

    getMergeRequestComments(projectId: string | number, mrIid: number, limit = 50): Promise<GitLabMRNote[]> {
        const params = new URLSearchParams({ per_page: String(limit) });
        return this.request<GitLabMRNote[]>(
            `/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/notes?${params}`,
        );
    }

    addMergeRequestComment(projectId: string | number, mrIid: number, body: string): Promise<GitLabMRNote> {
        return this.request<GitLabMRNote>(
            `/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/notes`,
            { method: 'POST', body: JSON.stringify({ body }) },
        );
    }

    getMergeRequest(projectId: string | number, mrIid: number): Promise<GitLabMergeRequest> {
        return this.request<GitLabMergeRequest>(
            `/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}`,
        );
    }

    listCommits(projectId: string | number, ref?: string, limit = 20): Promise<GitLabCommit[]> {
        const params = new URLSearchParams({ per_page: String(limit) });
        if (ref) params.set('ref_name', ref);
        return this.request<GitLabCommit[]>(
            `/projects/${encodeURIComponent(projectId)}/repository/commits?${params}`,
        );
    }

    async triggerPipeline(projectId: string | number, ref: string): Promise<GitLabPipeline> {
        return await this.request<GitLabPipeline>(
            `/projects/${encodeURIComponent(projectId)}/pipeline`,
            { method: 'POST', body: JSON.stringify({ ref }) },
        );
    }

    async retryJob(projectId: string | number, jobId: number): Promise<GitLabJob> {
        return await this.request<GitLabJob>(
            `/projects/${encodeURIComponent(projectId)}/jobs/${jobId}/retry`,
            { method: 'POST' },
        );
    }

    async deleteBranch(projectId: string | number, branchName: string): Promise<void> {
        await this.request(
            `/projects/${encodeURIComponent(projectId)}/repository/branches/${encodeURIComponent(branchName)}`,
            { method: 'DELETE' },
        );
    }
}
