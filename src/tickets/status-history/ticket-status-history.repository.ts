import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/infra/database/database.service';
import {
  CreateTicketStatusHistoryInput,
  TicketStatusHistoryRow,
} from './ticket-status-history.types';

@Injectable()
export class TicketStatusHistoryRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(
    input: CreateTicketStatusHistoryInput,
  ): Promise<TicketStatusHistoryRow> {
    const result = await this.db.query<TicketStatusHistoryRow>({
      text: `
        INSERT INTO
          ticket_status_history (ticket_id, previous_status, new_status, changed_by)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *;
      `,
      values: [
        input.ticketId,
        input.previousStatus,
        input.newStatus,
        input.changedBy,
      ],
    });

    return result.rows[0];
  }

  async findManyByTicketId(
    ticketId: string,
  ): Promise<TicketStatusHistoryRow[]> {
    const result = await this.db.query<TicketStatusHistoryRow>({
      text: `
        SELECT
          *
        FROM
          ticket_status_history
        WHERE
          ticket_id = $1
        ORDER BY
          created_at ASC
      `,
      values: [ticketId],
    });

    return result.rows;
  }
}
