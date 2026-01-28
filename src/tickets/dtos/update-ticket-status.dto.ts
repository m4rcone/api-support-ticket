import { IsEnum } from 'class-validator';
import { TicketStatus } from '../tickets.types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTicketStatusDto {
  @ApiProperty({ example: TicketStatus.IN_PROGRESS, enum: TicketStatus })
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
