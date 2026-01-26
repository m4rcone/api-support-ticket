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
          tickets (title, description, tag, created_by)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *;
      `,
      values: [input.title, input.description, input.tag, input.createdBy],
    });

    return result.rows[0];
  }
}
