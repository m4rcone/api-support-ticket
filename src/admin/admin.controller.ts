import {
  Body,
  Controller,
  Get,
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

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  get() {
    return 'OK';
  }

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
}
