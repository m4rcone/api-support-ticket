import { Ticket } from './tickets.types';
import { TicketResponseDto } from './dtos/ticket-response.dto';

export function mapTicketToResponseDto(ticket: Ticket): TicketResponseDto {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    tag: ticket.tag,
    createdBy: ticket.createdBy,
    assignedTo: ticket.assignedTo,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}
