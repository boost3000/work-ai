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

    async search(cql: string, limit = 25): Promise<ConfluenceSearchResult[]> {
        const params = new URLSearchParams({ cql, limit: String(limit) });
        const result = await this.request<ConfluenceSearchResponse>(
            `/search?${params}`,
            'v1',
        );
        return result.results;
    }
}
