import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StatusModule } from './status/status.module';
import { StatusService } from './status/status.service';
import { StatusController } from './status/status.controller';
import { DatabaseModule } from './infra/database/database.module';
import { DatabaseService } from './infra/database/database.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    StatusModule,
  ],
  controllers: [StatusController],
  providers: [DatabaseService, StatusService],
})
export class AppModule {}
