import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { TicketResponseDto } from './dtos/ticket-response.dto';
import { mapTicketToResponseDto } from './tickets.mapper';
import type { AuthenticatedRequest } from '../auth/authenticated-request';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateTicketDto,
  ): Promise<TicketResponseDto> {
    const userId = req.user['sub'];
    const newTicket = await this.ticketsService.createTicket({
      title: body.title,
      description: body.description,
      tag: body.tag,
      createdBy: userId,
    });

    return mapTicketToResponseDto(newTicket);
  }
}
