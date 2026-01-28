import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateTicketCommentDto {
  @ApiProperty({
    example: 'What is the status of my ticket?',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content: string;
}
