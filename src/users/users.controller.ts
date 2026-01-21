import { Controller, Post, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import type { Request } from 'express';
import { User } from './users.types';

@Controller('users')
export class UsersController {
  constructor(readonly usersService: UsersService) {}

  @Post()
  createUser(@Req() request: Request): Promise<User> {
    const data = request.body;

    const createdUser = this.usersService.createUser({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    return createdUser;
  }
}
