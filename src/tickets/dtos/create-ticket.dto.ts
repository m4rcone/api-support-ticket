import { IsEnum, IsString } from 'class-validator';
import { TicketTag } from '../tickets.types';

export class CreateTicketDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(TicketTag)
  tag: TicketTag;
}
