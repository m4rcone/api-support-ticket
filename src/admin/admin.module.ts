import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from 'src/users/users.module';
import { TicketsModule } from 'src/tickets/tickets.module';

@Module({
  imports: [UsersModule, TicketsModule],
  controllers: [AdminController],
})
export class AdminModule {}
