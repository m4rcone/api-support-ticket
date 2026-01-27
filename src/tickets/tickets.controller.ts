import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { TicketResponseDto } from './dtos/ticket-response.dto';
import { mapTicketToResponseDto } from './tickets.mapper';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { ListTicketsQueryDto } from './dtos/list-tickets-query.dto';

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
    const newTicket = await this.ticketsService.createTicket(userId, {
      title: body.title,
      description: body.description,
      tag: body.tag,
    });

    return mapTicketToResponseDto(newTicket);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listTickets(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListTicketsQueryDto,
  ): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketsService.listTicketsForUser(req.user, {
      status: query.status,
      tag: query.tag,
      page: query.page ?? 1,
      perPage: query.perPage ?? 10,
    });

    return tickets.map(mapTicketToResponseDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTicket(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const ticketFound = await this.ticketsService.findOneById(id, req.user);

    return mapTicketToResponseDto(ticketFound);
  }
}
