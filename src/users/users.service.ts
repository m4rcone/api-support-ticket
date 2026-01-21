import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './users.types';

@Injectable()
export class UsersService {
  constructor(readonly usersRepository: UsersRepository) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const createdUser = await this.usersRepository.create(dto);

    return createdUser;
  }
}
