import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { DatabaseModule } from '../infra/database/database.module';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { TicketStatusHistoryRepository } from './status-history/ticket-status-history.repository';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository, TicketStatusHistoryRepository],
  exports: [TicketsService, TicketsRepository, TicketStatusHistoryRepository],
})
export class TicketsModule {}
