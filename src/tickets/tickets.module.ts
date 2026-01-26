import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { DatabaseModule } from '../infra/database/database.module';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository],
})
export class TicketsModule {}
