import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dtos/create-user.dto';
import { User, UserRole } from './users.types';
import { ValidationError } from '../infra/errors';
import { PasswordHasherService } from '../infra/crypto/password-hasher.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    await this.validateUniqueEmail(dto.email);

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const row = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.CUSTOMER,
    });

    const createdUser: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return createdUser;
  }

  private async validateUniqueEmail(email: string): Promise<void> {
    const exists = await this.usersRepository.existsByEmail(email);

    if (exists) {
      throw new ValidationError({
        message: 'O email informado já está sendo utilizado.',
        action: 'Utilize outro email para realizar a operação.',
      });
    }
  }
}
