import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus, TicketTag } from '../tickets.types';

export class ListTicketsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter tickets by status',
    enum: TicketStatus,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Filter tickets by tag/label',
    enum: TicketTag,
  })
  @IsOptional()
  @IsEnum(TicketTag)
  tag?: TicketTag;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  perPage?: number = 10;
}
