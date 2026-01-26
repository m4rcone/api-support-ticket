import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { PasswordHasherService } from '../infra/crypto/password-hasher.service';
import { DatabaseService } from '../infra/database/database.service';

@Module({
  controllers: [AdminController],
  providers: [
    DatabaseService,
    UsersService,
    UsersRepository,
    PasswordHasherService,
  ],
})
export class AdminModule {}
