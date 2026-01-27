import { TicketStatusHistory } from './ticket-status-history.types';
import { TicketStatusHistoryResponseDto } from './dtos/ticket-status-history-response.dto';

export function mapTicketStatusHistoryToResponseDto(
  history: TicketStatusHistory,
): TicketStatusHistoryResponseDto {
  return {
    id: history.id,
    ticketId: history.ticketId,
    previousStatus: history.previousStatus,
    newStatus: history.newStatus,
    changedBy: history.changedBy,
    createdAt: history.createdAt,
  };
}
