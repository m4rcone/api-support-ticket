import { Injectable } from '@nestjs/common';
import { CreateTicketInput, Ticket } from './tickets.types';
import { TicketsRepository } from './tickets.repository';
import { ForbiddenError, NotFoundError } from '../infra/errors';
import { UserRole } from '../users/users.types';

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
      assignedTo: row.assigned_to,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return createdTicket;
  }

  async findOneById(
    id: string,
    user: { sub: string; role: UserRole },
  ): Promise<Ticket> {
    const row = await this.ticketsRepository.findOneById(id);

    if (!row) {
      throw new NotFoundError({
        message: 'O id informado não foi encontrado no sistema.',
        action: 'Verifique o id informado e tente novamente.',
      });
    }

    const ticketFound: Ticket = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      tag: row.tag,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    if (user.role === UserRole.CUSTOMER && ticketFound.createdBy !== user.sub) {
      throw new ForbiddenError({});
    }

    if (
      user.role === UserRole.AGENT &&
      (ticketFound.assignedTo !== user.sub ||
        ticketFound.createdBy !== user.sub)
    ) {
      throw new ForbiddenError({});
    }

    return ticketFound;
  }

  async assignTicket(id: string, agentId: string): Promise<Ticket> {
    const ticketFound = await this.ticketsRepository.findOneById(id);

    if (!ticketFound) {
      throw new NotFoundError({
        message: 'O id informado não foi encontrado no sistema.',
        action: 'Verifique o id informado e tente novamente.',
      });
    }

    const row = await this.ticketsRepository.updateAssignedTo(
      ticketFound.id,
      agentId,
    );

    const updatedTicket: Ticket = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      tag: row.tag,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return updatedTicket;
  }
}
