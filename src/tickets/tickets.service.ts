import { Injectable } from '@nestjs/common';
import { CreateTicketInput, Ticket } from './tickets.types';
import { TicketsRepository } from './tickets.repository';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    const row = await this.ticketsRepository.create(input);

    const createdTicket: Ticket = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      tag: row.tag,
      createdBy: row.created_by,
      assignedTo: undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return createdTicket;
  }
}
