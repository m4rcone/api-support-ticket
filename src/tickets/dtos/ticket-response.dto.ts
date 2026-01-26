import { TicketStatus, TicketTag } from '../tickets.types';

export class TicketResponseDto {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  tag: TicketTag;
  createdBy: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
}
