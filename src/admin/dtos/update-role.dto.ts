import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/users.types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ example: UserRole.AGENT, enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
