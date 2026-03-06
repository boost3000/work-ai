export interface GitLabConfig {
    baseUrl: string;
    token: string;
}

export interface GitLabProject {
    id: number;
    name: string;
    path_with_namespace: string;
    description: string | null;
    default_branch: string;
    web_url: string;
    last_activity_at: string;
}

export interface GitLabTreeItem {
    id: string;
    name: string;
    type: 'blob' | 'tree';
    path: string;
    mode: string;
}

export interface GitLabFile {
    file_name: string;
    file_path: string;
    size: number;
    encoding: string;
    content: string;
    ref: string;
}

export interface GitLabMergeRequest {
    id: number;
    iid: number;
    title: string;
    state: string;
    source_branch: string;
    target_branch: string;
    author: { name: string; username: string };
    created_at: string;
    updated_at: string;
    web_url: string;
    description: string | null;
}

export interface GitLabBranch {
    name: string;
    merged: boolean;
    protected: boolean;
    default: boolean;
    commit: { id: string; short_id: string; title: string; committed_date: string };
}

export interface GitLabPipeline {
    id: number;
    iid: number;
    status: string;
    ref: string;
    sha: string;
    created_at: string;
    updated_at: string;
    web_url: string;
}
