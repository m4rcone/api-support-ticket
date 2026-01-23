import { Pool } from 'pg';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { QueryConfig, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    this.pool = new Pool({
      connectionString,
      application_name: 'api-support-ticket',
    });
  }

  async query<T extends QueryResultRow = any>(
    queryTextOrConfig: string | QueryConfig<any[]>,
  ): Promise<QueryResult<T>> {
    return this.pool.query(queryTextOrConfig);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
