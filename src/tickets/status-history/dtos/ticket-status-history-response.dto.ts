import { TicketStatus } from '../../tickets.types';

export class TicketStatusHistoryResponseDto {
  id: string;
  ticketId: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  changedBy: string;
  createdAt: Date;
}
