import type { LokiConfig, LokiLogEntry } from './types.ts';

export class LokiClient {
    private baseUrl: string;
    private authHeader: string;
    private datasourceUid: string;

    constructor(config: LokiConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, '');
        this.authHeader = 'Basic ' + btoa(`${config.username}:${config.password}`);
        this.datasourceUid = config.datasourceUid;
    }

    private get proxyBase(): string {
        return `${this.baseUrl}/api/datasources/proxy/uid/${this.datasourceUid}/loki/api/v1`;
    }

    async queryRange(params: {
        query: string;
        from?: string;
        to?: string;
        limit?: number;
        direction?: 'forward' | 'backward';
    }): Promise<LokiLogEntry[]> {
        const url = new URL(`${this.proxyBase}/query_range`);
        url.searchParams.set('query', params.query);
        url.searchParams.set('limit', String(params.limit ?? 100));
        url.searchParams.set('direction', params.direction ?? 'backward');

        if (params.from) url.searchParams.set('start', params.from);
        if (params.to) url.searchParams.set('end', params.to);

        const response = await fetch(url.toString(), {
            headers: { Authorization: this.authHeader },
        });

        if (!response.ok) {
            throw new Error(`Loki HTTP error ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const entries: LokiLogEntry[] = [];

        for (const stream of data.data?.result ?? []) {
            const labels: Record<string, string> = stream.stream ?? {};
            for (const [ts, line] of stream.values ?? []) {
                entries.push({
                    timestamp: new Date(Number(ts) / 1_000_000).toISOString(),
                    line,
                    labels,
                });
            }
        }

        return entries;
    }

    async getLabels(): Promise<string[]> {
        const response = await fetch(`${this.proxyBase}/labels`, {
            headers: { Authorization: this.authHeader },
        });

        if (!response.ok) {
            throw new Error(`Loki HTTP error ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data ?? [];
    }

    async getLabelValues(label: string): Promise<string[]> {
        const response = await fetch(`${this.proxyBase}/label/${encodeURIComponent(label)}/values`, {
            headers: { Authorization: this.authHeader },
        });

        if (!response.ok) {
            throw new Error(`Loki HTTP error ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data ?? [];
    }
}
