import type {
    ConfluenceConfig,
    ConfluencePage,
    ConfluencePagesResponse,
    ConfluenceSearchResponse,
    ConfluenceSearchResult,
    ConfluenceSpace,
    ConfluenceSpacesResponse,
} from './types.ts';

export class ConfluenceClient {
    private baseUrl: string;
    private authHeader: string;

    constructor(config: ConfluenceConfig) {
        this.baseUrl = config.baseUrl;
        this.authHeader = 'Basic ' + btoa(`${config.email}:${config.apiToken}`);
    }

    private async request<T>(path: string, apiVersion: 'v1' | 'v2' = 'v2'): Promise<T> {
        const prefix = apiVersion === 'v2' ? '/wiki/api/v2' : '/wiki/rest/api';
        const url = `${this.baseUrl}${prefix}${path}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': this.authHeader,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Confluence API error ${response.status} ${response.statusText}: ${body}`);
        }

        return response.json() as Promise<T>;
    }

    async getSpaces(limit = 25): Promise<ConfluenceSpace[]> {
        const result = await this.request<ConfluenceSpacesResponse>(`/spaces?limit=${limit}`);
        return result.results;
    }

    async getPages(spaceId: string, limit = 25): Promise<ConfluencePage[]> {
        const result = await this.request<ConfluencePagesResponse>(
            `/spaces/${encodeURIComponent(spaceId)}/pages?limit=${limit}`,
        );
        return result.results;
    }

    getPage(pageId: string, includeBody = true): Promise<ConfluencePage> {
        const params = includeBody ? '?body-format=storage' : '';
        return this.request<ConfluencePage>(`/pages/${encodeURIComponent(pageId)}${params}`);
    }

    private async write<T>(path: string, options: RequestInit): Promise<T> {
        const url = `${this.baseUrl}/wiki/api/v2${path}`;
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
            throw new Error(`Confluence API error ${response.status} ${response.statusText}: ${body}`);
        }

        return response.json() as Promise<T>;
    }

    createPage(spaceId: string, title: string, content: string, parentId?: string): Promise<ConfluencePage> {
        const body: Record<string, unknown> = {
            spaceId,
            title,
            body: { representation: 'storage', value: content },
        };
        if (parentId) body.parentId = parentId;
        return this.write<ConfluencePage>('/pages', { method: 'POST', body: JSON.stringify(body) });
    }

    async updatePage(pageId: string, title: string, content: string, version: number): Promise<ConfluencePage> {
        return await this.write<ConfluencePage>(`/pages/${encodeURIComponent(pageId)}`, {
            method: 'PUT',
            body: JSON.stringify({
                id: pageId,
                title,
                version: { number: version },
                body: { representation: 'storage', value: content },
            }),
        });
    }

    async search(cql: string, limit = 25): Promise<ConfluenceSearchResult[]> {
        const params = new URLSearchParams({ cql, limit: String(limit) });
        const result = await this.request<ConfluenceSearchResponse>(
            `/search?${params}`,
            'v1',
        );
        return result.results;
    }
}
