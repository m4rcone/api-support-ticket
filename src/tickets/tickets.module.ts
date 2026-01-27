import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { DatabaseModule } from '../infra/database/database.module';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { UsersRepository } from 'src/users/users.repository';
import { TicketStatusHistoryRepository } from './status-history/ticket-status-history.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    TicketsRepository,
    UsersRepository,
    TicketStatusHistoryRepository,
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
