import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { DatabaseModule } from '../infra/database/database.module';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { UsersRepository } from 'src/users/users.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository, UsersRepository],
})
export class TicketsModule {}
