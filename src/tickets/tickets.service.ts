import { Injectable } from '@nestjs/common';
import { Ticket, TicketStatus, TicketTag } from './tickets.types';
import { TicketsRepository } from './tickets.repository';
import { ForbiddenError, NotFoundError } from '../infra/errors';
import { UserRole } from '../users/users.types';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { UsersRepository } from 'src/users/users.repository';

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  private ensureValidStatusTransition(
    currentStatus: TicketStatus,
    newStatus: TicketStatus,
    user: { sub: string; role: UserRole },
    ticket: Ticket,
  ) {
    if (
      currentStatus === TicketStatus.CLOSED &&
      newStatus !== TicketStatus.CLOSED &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenError({
        message:
          'O status de um ticket fechado só pode ser alterado por um administrador.',
        action:
          'Entre em contato com um administrador para reabrir este ticket.',
      });
    }

    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.CUSTOMER) {
      const isOwner = ticket.createdBy === user.sub;

      if (!isOwner) {
        throw new ForbiddenError({});
      }

      const allowedForCustomer =
        (currentStatus === TicketStatus.OPEN &&
          newStatus === TicketStatus.CLOSED) ||
        (currentStatus === TicketStatus.RESOLVED &&
          newStatus === TicketStatus.OPEN);

      if (!allowedForCustomer) {
        throw new ForbiddenError({
          message:
            'Você não tem permissão para alterar o status do ticket para este valor.',
          action:
            'Verifique o status atual do ticket e as ações permitidas para a sua conta.',
        });
      }

      return;
    }

    if (user.role === UserRole.AGENT) {
      const isAssigned = ticket.assignedTo === user.sub;

      if (!isAssigned) {
        throw new ForbiddenError({});
      }

      const allowedForAgent =
        (currentStatus === TicketStatus.OPEN &&
          newStatus === TicketStatus.IN_PROGRESS) ||
        (currentStatus === TicketStatus.IN_PROGRESS &&
          newStatus === TicketStatus.RESOLVED) ||
        (currentStatus === TicketStatus.RESOLVED &&
          newStatus === TicketStatus.IN_PROGRESS);

      if (!allowedForAgent) {
        throw new ForbiddenError({
          message:
            'Você não tem permissão para alterar o status do ticket para este valor.',
          action:
            'Verifique o status atual do ticket e as ações permitidas para a sua conta.',
        });
      }
    }
  }

  async createTicket(userId: string, dto: CreateTicketDto): Promise<Ticket> {
    const row = await this.ticketsRepository.create({
      title: dto.title,
      description: dto.description,
      status: TicketStatus.OPEN,
      tag: dto.tag,
      createdBy: userId,
      assignedTo: null,
    });

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

  async listTicketsForUser(
    user: { sub: string; role: UserRole },
    params: {
      status?: TicketStatus;
      tag?: TicketTag;
      page: number;
      perPage: number;
    },
  ): Promise<Ticket[]> {
    const { status, tag, page, perPage } = params;
    const limit = perPage;
    const offset = (page - 1) * perPage;

    if (user.role === UserRole.CUSTOMER) {
      const rows = await this.ticketsRepository.findMany({
        createdBy: user.sub,
        status,
        tag,
        limit,
        offset,
      });

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        tag: row.tag,
        createdBy: row.created_by,
        assignedTo: row.assigned_to,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    }

    if (user.role === UserRole.AGENT) {
      const rows = await this.ticketsRepository.findMany({
        assignedTo: user.sub,
        status,
        tag,
        limit,
        offset,
      });

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        tag: row.tag,
        createdBy: row.created_by,
        assignedTo: row.assigned_to,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    }

    const rows = await this.ticketsRepository.findMany({
      status,
      tag,
      limit,
      offset,
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      tag: row.tag,
      createdBy: row.created_by,
      assignedTo: row.assigned_to,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
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

    if (user.role === UserRole.AGENT && ticketFound.assignedTo !== user.sub) {
      throw new ForbiddenError({});
    }

    return ticketFound;
  }

  async assignTicket(id: string, agentId: string): Promise<Ticket> {
    const userFound = await this.usersRepository.findOneById(agentId);

    if (!userFound) {
      throw new NotFoundError({
        message: 'O id do agent informado não foi encontrado no sistema.',
        action: 'Verifique o id informado e tente novamente.',
      });
    }

    if (userFound.role === UserRole.CUSTOMER) {
      throw new ForbiddenError({
        message: 'O ticket não pode ser atribuído a um customer',
        action: 'Verifique o id do usuário informado e tente novamente',
      });
    }

    const ticketFound = await this.ticketsRepository.findOneById(id);

    if (!ticketFound) {
      throw new NotFoundError({
        message: 'O id do ticket informado não foi encontrado no sistema.',
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

  async updateStatus(
    id: string,
    newStatus: TicketStatus,
    user: { sub: string; role: UserRole },
  ): Promise<Ticket> {
    const row = await this.ticketsRepository.findOneById(id);

    if (!row) {
      throw new NotFoundError({
        message: 'O id do ticket informado não foi encontrado no sistema.',
        action: 'Verifique o id informado e tente novamente.',
      });
    }

    const ticket: Ticket = {
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

    if (user.role === UserRole.CUSTOMER && ticket.createdBy !== user.sub) {
      throw new ForbiddenError({});
    }

    if (user.role === UserRole.AGENT && ticket.assignedTo !== user.sub) {
      throw new ForbiddenError({});
    }

    if (ticket.status === newStatus) {
      return ticket;
    }

    this.ensureValidStatusTransition(ticket.status, newStatus, user, ticket);

    const updatedRow = await this.ticketsRepository.updateStatus(
      ticket.id,
      newStatus,
    );

    const updatedTicket: Ticket = {
      id: updatedRow.id,
      title: updatedRow.title,
      description: updatedRow.description,
      status: updatedRow.status,
      tag: updatedRow.tag,
      createdBy: updatedRow.created_by,
      assignedTo: updatedRow.assigned_to,
      createdAt: new Date(updatedRow.created_at),
      updatedAt: new Date(updatedRow.updated_at),
    };

    return updatedTicket;
  }
}
