import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { DatabaseModule } from '../infra/database/database.module';
import { PasswordHasherService } from '../infra/crypto/password-hasher.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, PasswordHasherService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
