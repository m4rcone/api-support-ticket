import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PasswordHasherService } from '../infra/crypto/password-hasher.service';
import { User } from '../users/users.types';
import { NotFoundError, UnauthorizedError } from '../infra/errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasherService: PasswordHasherService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    let user: User;
    try {
      user = await this.usersService.findOneByEmail(email);
      const correctPasswordMatch = await this.passwordHasherService.compare(
        password,
        user.passwordHash,
      );

      if (!correctPasswordMatch) {
        throw new UnauthorizedError({
          message: 'Os dados de autenticação não conferem.',
          action: 'Verifique se os dados enviados estão corretos.',
        });
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: 'Os dados de autenticação não conferem.',
          action: 'Verifique se os dados enviados estão corretos.',
        });
      }

      throw error;
    }

    return user;
  }
}
