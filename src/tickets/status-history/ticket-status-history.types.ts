import { TicketStatus } from '../tickets.types';

export type TicketStatusHistoryRow = {
  id: string;
  ticket_id: string;
  previous_status: TicketStatus;
  new_status: TicketStatus;
  changed_by: string;
  created_at: string;
};

export type TicketStatusHistory = {
  id: string;
  ticketId: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  changedBy: string;
  createdAt: Date;
};

export type CreateTicketStatusHistoryInput = {
  ticketId: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  changedBy: string;
};
