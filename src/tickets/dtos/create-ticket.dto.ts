import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { TicketTag } from '../tickets.types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Unable to access account',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'I am unable to log in to my account since yesterday.',
  })
  @IsString()
  description: string;

  @ApiProperty({ example: TicketTag.BUG, enum: TicketTag })
  @IsEnum(TicketTag)
  tag: TicketTag;
}
