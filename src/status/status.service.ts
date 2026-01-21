import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/infra/database/database.service';

@Injectable()
export class StatusService {
  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
  ) {}

  async checkDatabase() {
    try {
      const databaseName = this.config.get<string>('POSTGRES_DB');

      const [resultVersion, resultMaxConnections, resultOpenedConnections] =
        await Promise.all([
          this.db.query('SHOW server_version;'),
          this.db.query('SHOW max_connections;'),
          this.db.query({
            text: 'SELECT COUNT(*)::int as opened_connections FROM pg_stat_activity WHERE datname = $1;',
            values: [databaseName],
          }),
        ]);

      const version = resultVersion.rows[0].server_version;

      const maxConnections = parseInt(
        resultMaxConnections.rows[0].max_connections,
      );
      const openedConnections =
        resultOpenedConnections.rows[0].opened_connections;

      return {
        database: {
          version,
          max_connections: maxConnections,
          opened_connections: openedConnections,
        },
      };
    } catch (error) {
      return {
        database: {
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
