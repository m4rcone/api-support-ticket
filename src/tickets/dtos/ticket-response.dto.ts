import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus, TicketTag } from '../tickets.types';

export class TicketResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Unable to access account' })
  title: string;

  @ApiProperty({
    example: 'I am unable to log in to my account since yesterday.',
  })
  description: string;

  @ApiProperty({ example: TicketStatus.IN_PROGRESS, enum: TicketStatus })
  status: TicketStatus;

  @ApiProperty({ example: TicketTag.BUG, enum: TicketTag })
  tag: TicketTag;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  createdBy: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nullable: true,
  })
  assignedTo: string | null;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;

  @ApiProperty({ example: new Date().toISOString() })
  updatedAt: Date;
}
