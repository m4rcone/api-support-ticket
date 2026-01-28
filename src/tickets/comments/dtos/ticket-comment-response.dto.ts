import { ApiProperty } from '@nestjs/swagger';

export class TicketCommentResponseDto {
  @ApiProperty({ example: 'b1c2d3e4-f5g6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b1c2d3e4-f5g6-7890-abcd-ef1234567890' })
  ticketId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  authorId: string;

  @ApiProperty({ example: 'What is the status of my ticket?' })
  content: string;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;

  @ApiProperty({ example: new Date().toISOString() })
  updatedAt: Date;
}
