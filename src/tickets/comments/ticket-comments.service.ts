import { Injectable } from '@nestjs/common';
import { TicketsService } from '../tickets.service';
import { UserRole } from 'src/users/users.types';
import { TicketComment, TicketCommentRow } from './ticket-comments.types';
import { TicketCommentsRepository } from './ticket-comments.repository';

@Injectable()
export class TicketCommentsService {
  constructor(
    private readonly ticketCommentsRepository: TicketCommentsRepository,
    private readonly ticketsService: TicketsService,
  ) {}

  private mapRowToComment(row: TicketCommentRow): TicketComment {
    return {
      id: row.id,
      ticketId: row.ticket_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async createComment(
    ticketId: string,
    user: { sub: string; role: UserRole },
    content: string,
  ): Promise<TicketComment> {
    await this.ticketsService.findOneById(ticketId, user);

    const row = await this.ticketCommentsRepository.create({
      ticketId,
      authorId: user.sub,
      content,
    });

    return this.mapRowToComment(row);
  }

  async listComments(
    ticketId: string,
    user: { sub: string; role: UserRole },
  ): Promise<TicketComment[]> {
    await this.ticketsService.findOneById(ticketId, user);

    const rows =
      await this.ticketCommentsRepository.findManyByTicketId(ticketId);

    return rows.map((row) => this.mapRowToComment(row));
  }
}
