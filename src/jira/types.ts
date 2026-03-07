export interface JiraConfig {
    baseUrl: string;
    email: string;
    apiToken: string;
}

export interface JiraUser {
    accountId: string;
    displayName: string;
    emailAddress?: string;
}

export interface JiraStatus {
    id: string;
    name: string;
    statusCategory: {
        id: number;
        key: string;
        name: string;
    };
}

export interface JiraPriority {
    id: string;
    name: string;
}

export interface JiraProject {
    id: string;
    key: string;
    name: string;
}

export interface JiraIssueType {
    id: string;
    name: string;
    subtask: boolean;
}

export interface JiraIssueFields {
    summary: string;
    status: JiraStatus;
    assignee: JiraUser | null;
    reporter: JiraUser | null;
    priority: JiraPriority;
    project: JiraProject;
    issuetype: JiraIssueType;
    description: unknown;
    created: string;
    updated: string;
    labels: string[];
}

export interface JiraIssue {
    id: string;
    key: string;
    self: string;
    fields: JiraIssueFields;
}

export interface JiraSearchResult {
    issues: JiraIssue[];
    isLast: boolean;
    nextPageToken?: string;
}

export interface JiraTransition {
    id: string;
    name: string;
    to: JiraStatus;
}

export interface JiraTransitionsResponse {
    transitions: JiraTransition[];
}

export interface JiraComment {
    id: string;
    author: JiraUser;
    body: unknown;
    created: string;
    updated: string;
}

export interface JiraCreatedIssue {
    id: string;
    key: string;
    self: string;
}

export interface JiraBoard {
    id: number;
    name: string;
    type: string;
}

export interface JiraSprint {
    id: number;
    name: string;
    state: 'active' | 'closed' | 'future';
    startDate?: string;
    endDate?: string;
    goal?: string;
    boardId: number;
}
