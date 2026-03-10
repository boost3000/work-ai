import type { JiraConfig } from '../jira/types.ts';

export type ConfluenceConfig = JiraConfig;

export interface ConfluenceSpace {
    id: string;
    key: string;
    name: string;
    type: string;
    status: string;
}

export interface ConfluenceSpacesResponse {
    results: ConfluenceSpace[];
    _links: { next?: string };
}

export interface ConfluencePageBody {
    storage?: { value: string; representation: string };
    view?: { value: string; representation: string };
}

export interface ConfluencePage {
    id: string;
    type: string;
    status: string;
    title: string;
    spaceId: string;
    version?: { number: number };
    body?: ConfluencePageBody;
    _links: { webui?: string };
}

export interface ConfluencePagesResponse {
    results: ConfluencePage[];
    _links: { next?: string };
}

export interface ConfluenceSearchResult {
    content?: ConfluencePage;
    title: string;
    excerpt: string;
    lastModified: string;
}

export interface ConfluenceSearchResponse {
    results: ConfluenceSearchResult[];
    totalSize: number;
    _links: { next?: string };
}
