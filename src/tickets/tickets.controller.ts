import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { UpdateTicketStatusDto } from './dtos/update-ticket-status.dto';
import { TicketStatusHistoryResponseDto } from './status-history/dtos/ticket-status-history-response.dto';
import { mapTicketStatusHistoryToResponseDto } from './status-history/ticket-status-history.mapper';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Tickets')
@ApiCookieAuth('accessToken')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @ApiOkResponse({
    type: TicketResponseDto,
  })
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

  @ApiOkResponse({
    type: TicketResponseDto,
    isArray: true,
  })
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

  @ApiOkResponse({
    type: TicketResponseDto,
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTicket(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TicketResponseDto> {
    const ticketFound = await this.ticketsService.findOneById(id, req.user);

    return mapTicketToResponseDto(ticketFound);
  }

  @ApiOkResponse({
    type: TicketResponseDto,
  })
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateTicketStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTicketStatusDto,
  ): Promise<TicketResponseDto> {
    const updatedTicket = await this.ticketsService.updateStatus(
      id,
      body.status,
      req.user,
    );

    return mapTicketToResponseDto(updatedTicket);
  }

  @ApiOkResponse({
    type: TicketStatusHistoryResponseDto,
    isArray: true,
  })
  @Get(':id/status-history')
  @HttpCode(HttpStatus.OK)
  async getTicketStatusHistory(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TicketStatusHistoryResponseDto[]> {
    const user = req.user;

    const history = await this.ticketsService.listStatusHistory(id, user);

    return history.map((item) => mapTicketStatusHistoryToResponseDto(item));
  }
}
