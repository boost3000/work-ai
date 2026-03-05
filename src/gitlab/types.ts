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
