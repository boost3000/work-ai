export interface LokiConfig {
    baseUrl: string;
    username: string;
    password: string;
    datasourceUid: string;
}

export interface LokiLogEntry {
    timestamp: string;
    line: string;
    labels: Record<string, string>;
}
