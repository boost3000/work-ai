export interface ElasticsearchConfig {
    apiUrl: string;
    apiKey: string;
}

export interface GameserverLog {
    timestamp: string;
    message: string;
    file: string;
    offset: number;
}
