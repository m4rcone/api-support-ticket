import { User } from './users.types';
import { UserResponseDto } from './dtos/user-response.dto';

export function mapUserToResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
