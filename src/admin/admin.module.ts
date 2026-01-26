import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { PasswordHasherService } from '../infra/crypto/password-hasher.service';
import { DatabaseService } from '../infra/database/database.service';
import { TicketsService } from '../tickets/tickets.service';
import { TicketsRepository } from '../tickets/tickets.repository';

@Module({
  controllers: [AdminController],
  providers: [
    DatabaseService,
    UsersService,
    UsersRepository,
    PasswordHasherService,
    TicketsService,
    TicketsRepository,
  ],
})
export class AdminModule {}
