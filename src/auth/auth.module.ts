import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalAuthGuard } from './local-auth.guard';
import { PasswordHasherService } from '../infra/crypto/password-hasher.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { DatabaseService } from '../infra/database/database.service';

@Module({
  imports: [UsersModule, PassportModule],
  controllers: [AuthController],
  providers: [
    UsersService,
    UsersRepository,
    DatabaseService,
    AuthService,
    LocalAuthGuard,
    PasswordHasherService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
