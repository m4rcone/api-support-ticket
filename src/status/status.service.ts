import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../infra/database/database.service';

@Injectable()
export class StatusService {
  constructor(private readonly db: DatabaseService) {}

  async checkDatabase() {
    try {
      const [resultVersion, resultMaxConnections, resultOpenedConnections] =
        await Promise.all([
          this.db.query<{ server_version: string }>('SHOW server_version;'),
          this.db.query<{ max_connections: string }>('SHOW max_connections;'),
          this.db.query<{
            opened_connections: string;
          }>({
            text: `
              SELECT COUNT(*)::int AS opened_connections
              FROM pg_stat_activity
              WHERE datname = current_database();
            `,
          }),
        ]);

      const version = resultVersion.rows[0].server_version;
      const maxConnections = Number(
        resultMaxConnections.rows[0].max_connections,
      );
      const openedConnections = Number(
        resultOpenedConnections.rows[0].opened_connections,
      );

      return {
        status: 'up',
        version,
        maxConnections,
        openedConnections,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        status: 'down',
        version: null,
        maxConnections: null,
        openedConnections: null,
      };
    }
  }
}
