import type { ElasticsearchConfig, GameserverLog } from './types.ts';

export class ElasticsearchClient {
    private apiUrl: string;
    private apiKey: string;

    constructor(config: ElasticsearchConfig) {
        this.apiUrl = config.apiUrl.replace(/\/+$/, '');
        this.apiKey = config.apiKey;
    }

    async searchGameserverLogs(
        gid: number,
        params: { search?: string; from?: string; to?: string; size?: number },
    ): Promise<GameserverLog[]> {
        // deno-lint-ignore no-explicit-any
        const filter: any[] = [
            { term: { 'fields.app': `server_${gid}` } },
        ];

        if (params.search) {
            filter.push({
                query_string: {
                    query: `*${params.search}*`,
                    fields: ['message', 'fields.message'],
                },
            });
        }

        if (params.from) {
            // deno-lint-ignore no-explicit-any
            const range: any = { gte: `${params.from}T00:00:00Z` };
            if (params.to) {
                range['lte'] = `${params.to}T23:59:29Z`;
            }
            filter.push({ range: { '@timestamp': range } });
        } else {
            filter.push({ range: { '@timestamp': { gte: 'now-24h' } } });
        }

        const body = {
            _source: ['@timestamp', 'log', 'message'],
            query: { bool: { filter } },
            sort: [
                { '@timestamp': { order: 'desc' } },
                { 'log.offset': { order: 'desc' } },
            ],
            size: params.size ?? 1000,
        };

        const response = await fetch(`${this.apiUrl}/_search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `ApiKey ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Elasticsearch HTTP error ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // deno-lint-ignore no-explicit-any
        const hits = data.hits.hits.map((el: { _source?: any }) => el._source);

        // deno-lint-ignore no-explicit-any
        return hits.map((hit: any) => ({
            timestamp: hit['@timestamp'],
            message: hit['message'],
            file: hit['log']['file']['path'].replaceAll('\\', '/'),
            offset: hit['log']['offset'],
        }));
    }
}
