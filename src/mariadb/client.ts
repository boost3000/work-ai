import mysql from 'mysql2/promise';
import type { MariaDbConfig } from './types.ts';

export class MariaDbClient {
    private pool: mysql.Pool;

    constructor(config: MariaDbConfig) {
        this.pool = mysql.createPool({
            host: config.hostname,
            user: config.username,
            password: config.password,
            database: config.database,
            waitForConnections: true,
            connectionLimit: 5,
            maxIdle: 5,
            idleTimeout: 60000,
            queueLimit: 1,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            dateStrings: true,
            decimalNumbers: true,
            connectTimeout: 10000,
        });
    }

    async query(sql: string): Promise<unknown[]> {
        const normalized = sql.trim().toUpperCase();
        if (!normalized.startsWith('SELECT') && !normalized.startsWith('SHOW') && !normalized.startsWith('DESCRIBE') && !normalized.startsWith('EXPLAIN')) {
            throw new Error('Only SELECT, SHOW, DESCRIBE, and EXPLAIN queries are allowed.');
        }
        const [rows] = await this.pool.query(sql);
        return rows as unknown[];
    }

    async end(): Promise<void> {
        await this.pool.end();
    }
}
