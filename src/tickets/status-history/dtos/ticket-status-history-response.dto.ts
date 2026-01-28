import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '../../tickets.types';

export class TicketStatusHistoryResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  ticketId: string;

  @ApiProperty({ example: TicketStatus.OPEN, enum: TicketStatus })
  previousStatus: TicketStatus;

  @ApiProperty({ example: TicketStatus.IN_PROGRESS, enum: TicketStatus })
  newStatus: TicketStatus;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  changedBy: string;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;
}
