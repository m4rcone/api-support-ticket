import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/users.types';

export class UpdateRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
