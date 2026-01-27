import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/infra/database/database.service';
import {
  CreateTicketCommentInput,
  TicketCommentRow,
} from './ticket-comments.types';

@Injectable()
export class TicketCommentsRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(input: CreateTicketCommentInput): Promise<TicketCommentRow> {
    const result = await this.db.query<TicketCommentRow>({
      text: `
        INSERT INTO
          ticket_comments (ticket_id, author_id, content)
        VALUES
          ($1, $2, $3)
        RETURNING
          *;
      `,
      values: [input.ticketId, input.authorId, input.content],
    });

    return result.rows[0];
  }

  async findManyByTicketId(ticketId: string): Promise<TicketCommentRow[]> {
    const result = await this.db.query<TicketCommentRow>({
      text: `
        SELECT
          *
        FROM
          ticket_comments
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
