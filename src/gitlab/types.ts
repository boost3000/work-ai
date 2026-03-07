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

export interface GitLabJob {
    id: number;
    name: string;
    stage: string;
    status: string;
    created_at: string;
    started_at: string | null;
    finished_at: string | null;
    duration: number | null;
    web_url: string;
}

export interface GitLabMRDiff {
    old_path: string;
    new_path: string;
    diff: string;
    new_file: boolean;
    deleted_file: boolean;
    renamed_file: boolean;
}

export interface GitLabMRNote {
    id: number;
    body: string;
    author: { name: string; username: string };
    created_at: string;
    updated_at: string;
    system: boolean;
    resolvable: boolean;
    resolved: boolean | null;
}

export interface GitLabCommit {
    id: string;
    short_id: string;
    title: string;
    author_name: string;
    authored_date: string;
    committed_date: string;
    message: string;
    web_url: string;
}

export interface GitLabPipelineDetail extends GitLabPipeline {
    user: { username: string } | null;
}
