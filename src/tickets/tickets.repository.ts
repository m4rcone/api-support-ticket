import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../infra/database/database.service';
import { CreateTicketInput, TicketRow } from './tickets.types';

@Injectable()
export class TicketsRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(input: CreateTicketInput): Promise<TicketRow> {
    const result = await this.db.query<TicketRow>({
      text: `
        INSERT INTO
          tickets (title, description, status, tag, created_by, assigned_to)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING
          *;
      `,
      values: [
        input.title,
        input.description,
        input.status,
        input.tag,
        input.createdBy,
        input.assignedTo,
      ],
    });

    return result.rows[0];
  }

  async findOneById(id: string): Promise<TicketRow | null> {
    const result = await this.db.query<TicketRow>({
      text: `
        SELECT
          *
        FROM
          tickets
        WHERE
          id = $1
        LIMIT 1
      `,
      values: [id],
    });

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0];
  }

  async updateAssignedTo(id: string, agentId: string): Promise<TicketRow> {
    const result = await this.db.query<TicketRow>({
      text: `
        UPDATE
          tickets
        SET
          assigned_to = $2,
          updated_at = now()
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, agentId],
    });

    return result.rows[0];
  }
}
