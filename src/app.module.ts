import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StatusModule } from './status/status.module';
import { DatabaseModule } from './infra/database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { TicketsModule } from './tickets/tickets.module';
import { TicketCommentsModule } from './tickets/comments/ticket-comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    DatabaseModule,
    StatusModule,
    UsersModule,
    AuthModule,
    AdminModule,
    TicketsModule,
    TicketCommentsModule,
  ],
})
export class AppModule {}
