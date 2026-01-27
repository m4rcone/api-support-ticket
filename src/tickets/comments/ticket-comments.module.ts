import { Module } from '@nestjs/common';
import { TicketCommentsController } from './ticket-comments.controller';
import { TicketCommentsService } from './ticket-comments.service';
import { TicketCommentsRepository } from './ticket-comments.repository';
import { DatabaseModule } from 'src/infra/database/database.module';
import { TicketsModule } from '../tickets.module';

@Module({
  imports: [DatabaseModule, TicketsModule],
  controllers: [TicketCommentsController],
  providers: [TicketCommentsService, TicketCommentsRepository],
})
export class TicketCommentsModule {}
