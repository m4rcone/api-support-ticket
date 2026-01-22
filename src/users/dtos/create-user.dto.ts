import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../users.types';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
