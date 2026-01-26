import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dtos/create-user.dto';
import { User, UserRole } from './users.types';
import { ForbiddenError, ValidationError } from '../infra/errors';
import { PasswordHasherService } from '../infra/crypto/password-hasher.service';
import { NotFoundError } from '../infra/errors';

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
      role: UserRole.CUSTOMER,
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

  async findOneByEmail(email: string): Promise<User> {
    const row = await this.usersRepository.findOneByEmail(email);

    if (!row) {
      throw new NotFoundError({
        message: 'O email informado não foi encontrado no sistema.',
        action: 'Verifique o email informado e tente novamente.',
      });
    }

    const userFound: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return userFound;
  }

  async findOneById(id: string): Promise<User> {
    const row = await this.usersRepository.findOneById(id);

    if (!row) {
      throw new NotFoundError({
        message: 'O id informado não foi encontrado no sistema.',
        action: 'Verifique o id informado e tente novamente.',
      });
    }

    const userFound: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return userFound;
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const currentUser = await this.findOneById(id);

    const isChangingAdmin =
      currentUser.role === UserRole.ADMIN && role !== UserRole.ADMIN;

    if (isChangingAdmin) {
      const adminsCount = await this.usersRepository.countAdmins();

      if (adminsCount <= 1) {
        throw new ForbiddenError({
          message: 'Não é permitido remover o último administrador do sistema.',
          action: 'Crie outro usuário ADMIN antes de alterar esta role.',
        });
      }
    }

    const row = await this.usersRepository.updateRole(id, role);

    const updatedUser: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return updatedUser;
  }

  private async validateUniqueEmail(email: string): Promise<void> {
    const exists = await this.usersRepository.findOneByEmail(email);

    if (exists) {
      throw new ValidationError({
        message: 'O email informado já está sendo utilizado.',
        action: 'Utilize outro email para realizar a operação.',
      });
    }
  }
}
