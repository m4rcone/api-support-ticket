import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/users.types';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { mapUserToResponseDto } from '../users/users.mapper';
import { AssignTicketDto } from './dtos/assign-ticket.dto';
import { TicketsService } from '../tickets/tickets.service';
import { TicketResponseDto } from '../tickets/dtos/ticket-response.dto';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiCookieAuth('accessToken')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ticketsService: TicketsService,
  ) {}

  @ApiOkResponse({
    type: UserResponseDto,
  })
  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async updateRole(
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateRole(id, body.role);

    return mapUserToResponseDto(user);
  }

  @ApiOkResponse({
    type: TicketResponseDto,
  })
  @Patch('tickets/:id/assign')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async AssignTicket(
    @Param('id') id: string,
    @Body() body: AssignTicketDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.assignTicket(id, body.agentId);

    return ticket;
  }
}
