import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { DatabaseModule } from '../infra/database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}
